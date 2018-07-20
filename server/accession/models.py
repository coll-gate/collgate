# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate accession module models.
# @author Frédéric SCHERMA (INRA UMR1095), Medhi BOULNEMOUR (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import re

from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.db.models import Q, Prefetch
from django.utils import translation
from django.utils.translation import ugettext_lazy as _
from igdectk.common.models import ChoiceEnum, IntegerChoice

from accession import localsettings
from classification.models import ClassificationEntry
from descriptor.models import DescribableEntity
from descriptor.models import Layout
from main.models import Entity, EntitySynonym, ContentType, EntitySynonymType


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
        columns = {
            'primary_classification_entry': {
                'label': _('Classification principal'),
                'field': 'name',
                'query': True,  # False,   # could be later, for the moment LEFT JOIN into the queryset
                'format': {
                    'type': 'entity',
                    'model': 'classification.classificationentry',
                    'details': True
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'layout': {
                'label': _('Layout'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'layout',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
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
            },
            'classifications': {
                'label': _('Classifications'),
                'field': 'name',
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'entity',
                    'model': 'classification.classificationentry',
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

        synonym_types = EntitySynonymType.objects.filter(target_model=ContentType.objects.get_for_model(Accession))

        for synonym_type in synonym_types:
            columns['&' + synonym_type.name] = {
                'label': synonym_type.get_label(),
                # 'field': 'synonym',
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'accession.accessionsynonym',
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            }

            if synonym_type.multiple_entry:
                columns['&' + synonym_type.name]['column_display'] = False
                columns['&' + synonym_type.name]['search_display'] = True

        return columns

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
            'layout': self.layout_id,
            'descriptors': self.descriptors,
            'comments': self.comments
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

            if 'comments' in self.updated_fields:
                result['comments'] = self.comments

            return result
        else:
            return {
                'name': self.name,
                'code': self.code,
                'primary_classification_entry': self.primary_classification_entry_id,
                'descriptors': self.descriptors,
                'comments': self.comments
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def data(self, field=None, default=None):
        data = self.layout.parameters.get('data')
        if data and field in data:
            return data.get(field)
        else:
            return default

    @classmethod
    def export_list(cls, columns, cursor, search, filters, order_by, limit, user):
        res_columns = []
        items = []

        if not order_by:
            order_by = ['id']

        from main.cursor import CursorQuery
        cq = CursorQuery(Accession)

        if search:
            cq.filter(search)

        if filters:
            cq.filter(filters)

        # @todo filter given user permission per accession (v2)

        # accession panels ids
        cq.m2m_to_array_field(
            relationship=AccessionPanel.accessions,
            selected_field='accessionpanel_id',
            from_related_field='id',
            to_related_field='accession_id',
            alias='panels'
        )

        # classifications entries
        cq.m2m_to_array_field(
            relationship=Accession.classifications_entries,
            selected_field='classification_entry_id',
            from_related_field='id',
            to_related_field='accession_id',
            alias='classifications'
        )

        # synonyms
        cq.set_synonym_model(AccessionSynonym)

        cq.prefetch_related(Prefetch(
            "synonyms",
            queryset=AccessionSynonym.objects.all().order_by('synonym_type', 'language')
        ))

        cq.select_related('primary_classification_entry->name', 'primary_classification_entry->rank')

        cq.cursor(cursor, order_by)
        cq.order_by(order_by).limit(limit)

        accession_items = []

        synonym_types = dict(
            EntitySynonymType.objects.filter(target_model=ContentType.objects.get_for_model(Accession)).values_list(
                'id', 'name'))

        for accession in cq:
            item = []

            for col in columns:
                if col == 'id':
                    item.append(str(accession.pk))
                elif col == 'name':
                    item.append(accession.name)
                elif col == 'code':
                    item.append(accession.code)
                elif col == 'primary_classification_entry':
                    item.append(str(accession.primary_classification_entry_id))
                    # 'id': accession.primary_classification_entry.id,
                    # 'name': accession.primary_classification_entry.name,
                    # 'rank': accession.primary_classification_entry.rank_id,
                elif col == 'layout':
                    item.append(str(accession.layout_id))
                    # layout name ??
                elif col.startswith('#'):
                    item.append("")  # descriptors
                elif col.startswith('&'):
                    item.append("")  # synonyms
                    # for synonym in accession.synonyms.all():
                    #     synonym_type_name = synonym_types.get(synonym.synonym_type_id)
                    #     a['synonyms'][synonym_type_name] = {
                    #         'id': synonym.id,
                    #         'name': synonym.name,
                    #         'synonym_type': synonym.synonym_type_id,
                    #         'language': synonym.language
                    #     }
                elif col.startswith('$'):
                    item.append("")  # format
                elif col.startswith('@'):
                    item.append("")  # label
                else:
                    item.append("")

            items.append(item)

        res_columns = columns
        return res_columns, items


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

    # parent location
    location = models.ForeignKey('StorageLocation', related_name='batches', on_delete=models.PROTECT, null=True)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'layout': {
                'label': _('Layout'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'layout',
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
            'location': {
                'label': _('Storage location'),
                'field': 'name',
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'entity',
                    'model': 'accession.storagelocation'
                },
                'available_operators': [
                    'contains',
                    'not_contains',
                    'overlap',
                    'not_overlap'
                ],
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
            'layout': self.layout_id,
            'descriptors': self.descriptors,
            'comments': self.comments
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

            if 'comments' in self.updated_fields:
                result['comments'] = self.comments

            return result
        else:
            return {
                'name': self.name,
                'descriptors': self.descriptors,
                'comments': self.comments
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
    format = JSONField(default={"steps": []})

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
        Get the label for this layout in the current regional.
        """
        lang = translation.get_language()
        return self.label.get(lang, "")

    def on_client_cache_update(self):
        return [{
            'category': 'accession',
            'name': "action_types:*",
            'values': None
        }]

    def on_server_cache_update(self):
        return [{
            'category': 'accession',
            'name': "action_types:*",
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
    An action defines a process of creation or update of one or more entities like accessions or batches.
    And considers a suit of steps, as a sequential pipeline.
    """

    # display name
    name = models.CharField(max_length=128, db_index=True)

    # actor of the action
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)

    # action type
    action_type = models.ForeignKey(to=ActionType, on_delete=models.PROTECT)

    # associated steps data
    data = JSONField(default={"steps": []})

    # is the action completed
    completed = models.BooleanField(default=False, null=False, blank=False)

    # informative description.
    description = models.TextField(blank=True, default="")

    # format of the action, it is a replication of the format field of the action type to keep consistency for audit
    format = JSONField(default={"steps": []})

    class Meta:
        verbose_name = _("action")
        default_permissions = list()

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
            'created_date': {
                'label': _('Creation'),
                'query': False,
                'format': {
                    'type': 'datetime',
                },
                'available_operators': ['lte', 'gte', 'eq', 'neq']
            },
            'action_type': {
                'label': _('Type'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'entity',
                    'model': 'accession.actiontype'
                },
                'available_operators': ['eq', 'neq', 'in', 'notin']
            },
            'completed': {
                'label': _('Completed'),
                'query': False,
                'format': {
                    'type': 'boolean'
                },
                'available_operators': ['eq']
            },
            'user': {
                'label': _('Author'),
                'query': False,
                'format': {
                    'type': 'user',
                },
                'available_operators': ['lte', 'gte', 'eq', 'neq']
            },
        }

    def natural_name(self):
        return self.name


class ActionDataType(ChoiceEnum):
    """
    Type of a action data.
    """

    INPUT = IntegerChoice(0, _('Input'))
    OUTPUT = IntegerChoice(1, _('Output'))


class ActionData(models.Model):
    """
    Purely the data (input or output) for each step of each action.
    Input can be not defined.
    """

    # related action
    action = models.ForeignKey(Action, on_delete=models.CASCADE)

    # step 0 based index
    step_index = models.IntegerField(default=0)

    # data array, empty by default
    data = JSONField(default=[])

    # type of data (False : input,
    data_type = models.IntegerField(choices=ActionDataType.choices(), default=ActionDataType.INPUT.value)

    class Meta:
        unique_together = (('action', 'step_index', 'data_type'),)


class ActionToEntity(models.Model):
    """
    List of managed entities per action.
    """

    # related action
    action = models.ForeignKey(Action, on_delete=models.CASCADE)

    # content type of the target
    entity_type = models.ForeignKey(ContentType, on_delete=models.DO_NOTHING)

    # target entity id
    entity_id = models.IntegerField(null=False, blank=False)

    class Meta:
        index_together = (("entity_type", "entity_id"),)


class PanelType(ChoiceEnum):
    """
    Type of a panel.
    """

    PERSISTENT = IntegerChoice(0, _('Persistent'))
    WORKING = IntegerChoice(1, _('Working'))


class Panel(Entity):
    """
    Panel abstract model
    """

    # unique name of the panel
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # panel type (persistent, working...)
    panel_type = models.IntegerField(default=PanelType.PERSISTENT.value)

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a layout of descriptor.
    # It can be null because it is possible to have the choice to defines or not some descriptors
    layout = models.ForeignKey(Layout, null=True, on_delete=models.PROTECT)

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
    batches = models.ManyToManyField(Batch, related_name='panels')

    @classmethod
    def get_defaults_columns(cls):
        return {
            'layout': {
                'label': _('Layout'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'layout',
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
    accessions = models.ManyToManyField(Accession, related_name='panels')

    @classmethod
    def get_defaults_columns(cls):
        return {
            'layout': {
                'label': _('Layout'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'layout',
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
            ("list_accessionpanel", "Can list accession panels"),
        )


class StorageLocation(models.Model):
    """
    Defines storage locations of batches.
    @tddo why not an entity ?
    """

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 32, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # label validator
    LABEL_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^[^\s]+(\s+[^\s]+)*$"}

    # unique name of the panel
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # Customisable label of the action.
    # It is i18nized using a JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    # Parent location
    parent = models.ForeignKey('self', blank=True, null=True, related_name='children', on_delete=models.PROTECT)

    class Meta:
        verbose_name = _("storage location")

        permissions = (
            ("get_storagelocation", "Can get a storage location"),
            ("list_storagelocation", "Can list storage locations"),
        )

    def get_label(self):
        """
        Get the label for this storage location in the current regional.
        """
        lang = translation.get_language()
        return self.label.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        self.label[lang] = label

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            # 'layout': self.layout_id,
            # 'descriptors': self.descriptors,
            # 'comments': self.comments
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            # if 'descriptors' in self.updated_fields:
            #     if hasattr(self, 'updated_descriptors'):
            #         result['descriptors'] = self.updated_descriptors
            #     else:
            #         result['descriptors'] = self.descriptors
            #
            # if 'comments' in self.updated_fields:
            #     result['comments'] = self.comments

            return result
        else:
            return {
                'name': self.name,
                # 'descriptors': self.descriptors,
                # 'comments': self.comments
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }
