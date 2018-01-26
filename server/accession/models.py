# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate accession module models.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import re

from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField, ArrayField
from django.db import models
from django.db.models import Q
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from accession import localsettings
from classification.models import ClassificationEntry
from descriptor.models import DescribableEntity
from descriptor.models import DescriptorMetaModel
from igdectk.common.models import ChoiceEnum, IntegerChoice
from main.models import Entity, EntitySynonym, EntityStatus, ContentType, uuid


class AccessionClassificationEntry(models.Model):
    """
    M2M accession to classification entry with additional flags.
    """

    # accession object
    accession = models.ForeignKey('Accession', on_delete=models.PROTECT)

    # classification entry object
    classification_entry = models.ForeignKey(ClassificationEntry, on_delete=models.PROTECT)

    # is a primary or secondary classification association
    primary = models.BooleanField(default=False, db_index=True)

    def natural_name(self):
        return self.accession.name

    class Meta:
        index_together = (
            ('accession', 'classification_entry'),
            ('accession', 'primary')
        )


class Accession(DescribableEntity):
    """
    Accession entity defines a physical or virtual accession.
    """

    # name pattern
    NAME_RE = re.compile(r"^\S+.+\S+$", re.IGNORECASE)

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 255, "pattern": "^\S+.+\S+$"}

    # non-unique primary name of the accession
    name = models.CharField(max_length=255, db_index=True)

    # unique GRC code of the accession
    code = models.CharField(unique=True, max_length=255, db_index=True)

    # primary classification as simple FK for a simple join
    primary_classification_entry = models.ForeignKey(
        ClassificationEntry, on_delete=models.PROTECT, related_name='primary_accessions', null=True)

    # accession can have many classification but at least a primary
    classifications_entries = models.ManyToManyField(
        through=AccessionClassificationEntry, to=ClassificationEntry, related_name='accession_set')

    @classmethod
    def get_defaults_columns(cls):
        return {
            'primary_classification_entry': {
                'label': _('Classification'),
                'field': 'name',
                'query': True,  # False,   # could be later, for the moment LEFT JOIN into the queryset
                'format': {
                    'type': 'entity',
                    'model': 'classification.classificationentry',
                    'details': True
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'synonym': {
                'label': _('Synonym'),
                'field': 'name',
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accessionsynonym'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'code': {
                'label': _('Code'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'panels': {
                'label': _('Linked panels'),
                'field': 'name',
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'entity',
                    'model': 'accession.accessionpanel'
                },
                'available_operators': [
                    'contains',
                    'not_contains',
                    'overlap',
                    'not_overlap'
                ],

                'column_display': False,
                'search_display': True
            }
        }

    class Meta:
        verbose_name = _("accession")

        permissions = (
            ("get_accession", "Can get an accession"),
            ("list_accession", "Can list accessions"),
            ("search_accession", "Can search for accessions")
        )

    def natural_name(self):
        return self.name

    def details(self):
        return {
            'id': self.id,
            'name': self.name,
        }

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'code': self.code,
            'primary_classification_entry': self.primary_classification_entry_id,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'code' in self.updated_fields:
                result['code'] = self.code

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'primary_classification_entry' in self.updated_fields:
                result['primary_classification_entry'] = self.primary_classification_entry_id

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'updated_descriptors'):
                    result['descriptors'] = self.updated_descriptors
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'name': self.name,
                'code': self.code,
                'primary_classification_entry': self.primary_classification_entry_id,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def data(self, field=None, default=None):
        data = self.descriptor_meta_model.parameters.get('data')
        if data and field in data:
            return data.get(field)
        else:
            return default


class AccessionSynonym(EntitySynonym):
    """
    Synonym of accession model.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": "^\S+.+\S+$"}

    # code validator, used with content validation, to avoid any whitespace before and after
    CODE_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    entity = models.ForeignKey(Accession, related_name='synonyms', on_delete=models.CASCADE)

    class Meta:
        verbose_name = _("accession synonym")

    def is_primary(self):
        """
        Is a primary name synonym.
        :return: True if primary
        """
        return self.synonym_type_id == localsettings.synonym_type_accession_name

    def is_code(self):
        """
        Is a code synonym.
        :return: True if primary
        """
        return self.synonym_type_id == localsettings.synonym_type_accession_code


class Batch(DescribableEntity):
    """
    Batch for an accession.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # unique name of the batch
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # parent accession
    accession = models.ForeignKey('Accession', related_name='batches', on_delete=models.PROTECT)

    # direct parent batches
    batches = models.ManyToManyField('Batch', related_name='children')

    @classmethod
    def get_defaults_columns(cls):
        return {
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.batch'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.batch'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'panels': {
                'label': _('Linked panels'),
                'field': 'name',
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'entity',
                    'model': 'accession.batchpanel'
                },
                'available_operators': [
                    'contains',
                    'not_contains',
                    'overlap',
                    'not_overlap'
                ],

                'column_display': False,
                'search_display': True
            }
        }

    class Meta:
        verbose_name = _("batch")
        default_related_name = "batches"

        permissions = (
            ("get_batch", "Can get a batch"),
            ("list_batch", "Can list batch"),
            ("search_batch", "Can search for batches")
        )

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'accession': self.accession_id,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'updated_descriptors'):
                    result['descriptors'] = self.updated_descriptors
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'name': self.name,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }


class ActionType(Entity):
    """
    Type of action.
    """

    # unique name of the action
    name = models.CharField(unique=True, max_length=128, db_index=True)

    # Customisable label of the action.
    # It is i18nized using a JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    # Format of the action (can define a lot of parameters, like input, output, process...)
    format = JSONField(default={"type": "undefined"})

    # informative description.
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = _("batch action type")

    def natural_name(self):
        return self.get_label()

    @classmethod
    def get_defaults_columns(cls):
        return {
            'name': {
                'label': _('Name'),
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'accession.action'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            '@label': {
                'label': _('Label'),
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'accession.action'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            '$format': {
                'label': _('Type'),
                'field': 'type->name',
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'accession.batchactionformattype'
                }
            }
        }

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        self.label[lang] = label

    def get_label(self):
        """
        Get the label for this meta model in the current regional.
        """
        lang = translation.get_language()
        return self.label.get(lang, "")

    def on_client_cache_update(self):
        return [{
            'category': 'accession',
            'name': "action_types",
            'values': None
        }]

    def on_server_cache_update(self):
        return [{
            'category': 'accession',
            'name': "action_types",
            'values': None
        }]

    def in_usage(self):
        return Action.objects.filter(type_id=self.id).exists()

    def data(self, field=None, default=None):
        data = self.format.get('data')
        if data and field in data:
            return data.get(field)
        else:
            return default


class Action(Entity):
    """
    An action defines a process of creation or update of one or more output and a list of input batch or accessions
    altered or not modified, plus the relating accession.
    @todo update to support accessions
    """

    # actor of the action
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)

    # action type
    type = models.ForeignKey(to=ActionType, on_delete=models.PROTECT)

    # related parent accession
    accession = models.ForeignKey(Accession, db_index=True, on_delete=models.PROTECT)

    # list of initials batches used as parent for the creation of target batches
    input_batches = models.ManyToManyField(Batch, related_name='+')

    # list of created or updated batches
    output_batches = models.ManyToManyField(Batch, related_name='+')

    # associated data (advancement, status...)
    data = JSONField(default={"status": "created"})

    class Meta:
        verbose_name = _("action")

        index_together = (("accession", "type"),)

        default_permissions = list()

    @classmethod
    def get_defaults_columns(cls):
        return {
            'created_date': {
                'label': _('Date'),
                'query': False,
                'format': {
                    'type': 'datetime',
                },
                'available_operators': ['lte', 'gte', 'eq', 'neq']
            },
            'type': {
                'label': _('Type'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'entity',
                    'model': 'accession.actiontype'
                },
                'available_operators': ['eq', 'neq', 'in', 'notin']
            },
            'accession': {
                'label': _('Accession'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'entity',
                    'model': 'accession.accession'
                },
                'available_operators': ['eq', 'neq', 'in', 'notin']
            }
        }


class Panel(Entity):
    """
    Panel abstract model
    """

    # unique name of the panel
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a meta-model of descriptor.
    # It can be null because it is possible to have the choice to defines or not some descriptors
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, null=True, on_delete=models.PROTECT)

    class Meta:
        abstract = True

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)


class BatchPanel(Panel):
    """
    Defines a collection of batches
    """

    # list of batches
    batches = models.ManyToManyField(Batch)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.batchpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.batchpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'batches_amount': {
                'label': _('Batches amount'),
                'field': 'batches_amount',
                'query': False,
                'format': {
                    'type': 'int',
                    'model': 'accession.batchpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'gte', 'lte']
            }
        }

    class Meta:
        verbose_name = _("batch panel")

        permissions = (
            ("get_batchpanel", "Can get a batch panel"),
            ("list_batchpanel", "Can list batch panel"),
        )


class AccessionPanel(Panel):
    """
    Defines a collection of accessions
    """

    # related accessions
    accessions = models.ManyToManyField(Accession)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.accessionpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accessionpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'accessions_amount': {
                'label': _('Accessions amount'),
                'field': 'accessions_amount',
                'query': False,
                'format': {
                    'type': 'int',
                    'model': 'accession.accessionpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'gte', 'lte']
            }
        }

    class Meta:
        verbose_name = _("accession panel")

        permissions = (
            ("get_accessionpanel", "Can get a accession panel"),
            ("list_accessionpanel", "Can list accession panel"),
        )


class AccessionView(models.Model):
    """
    Accession from accession panel list view.
    """

    # non-unique primary name of the accession
    name = models.CharField(max_length=255, db_index=True)

    # unique GRC code of the accession
    code = models.CharField(unique=True, max_length=255, db_index=True)

    # primary classification as simple FK for a simple join
    primary_classification_entry = models.ForeignKey(
        ClassificationEntry, on_delete=models.DO_NOTHING, related_name='primary_accessions_view', null=True)

    # accession can have many classification but at least a primary
    classifications_entries = models.ManyToManyField(ClassificationEntry)

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a meta-model of descriptor.
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, on_delete=models.DO_NOTHING)

    # content type of the entity
    content_type = models.ForeignKey(ContentType, editable=False, on_delete=models.DO_NOTHING)

    # status of the entity
    entity_status = models.IntegerField(
        null=False, blank=False, choices=EntityStatus.choices(), default=EntityStatus.VALID.value)

    # insert date
    created_date = models.DateTimeField(auto_now_add=True)
    # last update date
    modified_date = models.DateTimeField(auto_now=True)

    # unique object identifier
    uuid = models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)

    # panels
    panels = ArrayField(models.IntegerField())

    class Meta:
        managed = False
        db_table = 'accession_panel_list'
        verbose_name = _("accession")

        permissions = (
            ("get_accession", "Can get an accession"),
            ("list_accession", "Can list accessions"),
            ("search_accession", "Can search for accessions")
        )

    def natural_name(self):
        return self.name

    def details(self):
        """
        Return the details field for the specialized entity. By default return an empty dict.
        :return: A dict of details
        """
        return {}

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'primary_classification_entry': {
                'label': _('Classification'),
                'field': 'name',
                'query': True,  # False,   # could be later, for the moment LEFT JOIN into the queryset
                'format': {
                    'type': 'entity',
                    'model': 'classification.classificationentry',
                    'details': True
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'synonym': {
                'label': _('Synonym'),
                'field': 'name',
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accessionsynonym'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'code': {
                'label': _('Code'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            }
        }


class BatchView(models.Model):
    """
    Batch from batch panel list view.
    """

    # unique name of the batch
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # parent accession
    accession = models.ForeignKey('Accession', related_name='batches_view', on_delete=models.DO_NOTHING)

    # direct parent batches
    batches = models.ManyToManyField('BatchView', related_name='children_view')

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a meta-model of descriptor.
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, on_delete=models.DO_NOTHING)

    # content type of the entity
    content_type = models.ForeignKey(ContentType, editable=False, on_delete=models.DO_NOTHING)

    # status of the entity
    entity_status = models.IntegerField(
        null=False, blank=False, choices=EntityStatus.choices(), default=EntityStatus.VALID.value)

    # insert date
    created_date = models.DateTimeField(auto_now_add=True)
    # last update date
    modified_date = models.DateTimeField(auto_now=True)

    # unique object identifier
    uuid = models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)

    # panels
    panels = ArrayField(models.IntegerField())

    @classmethod
    def get_defaults_columns(cls):
        return {
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.batch'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.batch'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            }
        }

    class Meta:
        managed = False
        db_table = 'batch_panel_list'
        verbose_name = _("batch")

        permissions = (
            ("get_batch", "Can get a batch"),
            ("list_batch", "Can list batch"),
            ("search_batch", "Can search for batches")
        )

    def natural_name(self):
        return self.name

    def details(self):
        """
        Return the details field for the specialized entity. By default return an empty dict.
        :return: A dict of details
        """
        return {}

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)
