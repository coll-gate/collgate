# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module models.
"""
import json

from django.db import models
from django.contrib.postgres.fields import HStoreField
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Languages, Entity


class DescriptorGroup(Entity):
    """
    Category of a type of descriptor for an accession.
    """

    # Is this group of descriptor can be deleted when it is empty
    can_delete = models.BooleanField(default=True)
    # Is this group of descriptor can be modified (rename, add/remove descriptors)
    # by an authorized staff people
    can_modify = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("descriptor group")


class DescriptorType(Entity):
    """
    Type of descriptor for an accession.
    Mostly related to a Crop Ontology code.
    """

    # code can be a Crop Ontology ('CO_XYZ') code (see http://www.cropontology.org/ontology)
    # and http://www.cropontology.org/get-ontology/CO_[0-9]{3,} to get a JSON version.
    # Internals codes are prefixed by 'ID_'.
    code = models.CharField(unique=True, max_length=64, null=False, blank=False)

    # default should belong to the general group.
    group = models.ForeignKey(DescriptorGroup, null=False, related_name='types_set')

    # informative description.
    description = models.TextField()

    # JSON encoded values (mostly a dict or empty). Value are classified by language at the first
    # level of JSON dict.
    values = models.TextField(default="", null=False)

    # JSON encoded format of the descriptor
    format = models.TextField(
        default='{"type": "string", "unit": "custom", "precision": "0.0", "fields": [], "trans": false}',
        null=False,
        blank=False)

    # Is this descriptor can be deleted by an authorised staff people
    can_delete = models.BooleanField(default=True)
    # Is this descriptor can be modified (rename, add/remove/modify its values)
    # by an authorised staff people
    can_modify = models.BooleanField(default=True)

    def count_num_values(self):
        """
        Counts and returns the number of values related to this descriptor according to the current language
        if there is translations otherwise the number of values.

        :return: Number of values
        :rtype: Integer
        """
        descriptor_format = json.loads(self.format)
        lang = translation.get_language()
        trans = descriptor_format.get('trans', False)

        if self.values:
            values = json.loads(self.values)

            if trans:
                count = len(values.get(lang, {}))
            else:
                count = len(values)
        else:
            if trans:
                count = self.values_set.filter(language=lang).count()
            else:
                count = self.values_set.all().count()

        return count

    class Meta:
        verbose_name = _("descriptor type")

    def has_values(self):
        """
        Check if there is some values for this descriptor for any languages

        :return: True if there is somes values
        :rtype: Boolean
        """
        if self.values:
            values = json.loads(self.values)

            return len(values) == 0
        else:
            return self.values_set.all().exists()


class DescriptorValue(Entity):
    """
    For some descriptors value are in a specific table.
    """

    # A value is dedicated for a descriptor and an language
    language = models.CharField(
        null=False,
        blank=False,
        max_length=8,
        choices=Languages.choices(),
        default=Languages.EN.value)

    descriptor = models.ForeignKey(DescriptorType, null=False, related_name='values_set')

    # Can be none, one or multiples parents values (ie: city in region in country...)
    # syntax could be "1,2" for two directs parent, and "1.2.3,4" with two parents and a hierarchy using dot
    parents = models.CharField(max_length=255, default="")

    # JSON encoded single value or object
    value = models.CharField(max_length=512, blank=False, null=False)

    class Meta:
        verbose_name = _("descriptor value")

        unique_together = (
            ('language', 'descriptor'),
        )


class AccessionSynonymType(ChoiceEnum):
    """
    Static but may evolve into a DB editable descriptor type. general::accession_synonym.
    And must be a mandatory descriptor (created by fixtures during initialization).
    """

    PRIMARY = IntegerChoice(0, _('Primary'))
    SYNONYM = IntegerChoice(1, _('Synonym'))
    CODE = IntegerChoice(2, _('Code'))


class AccessionSynonym(Entity):
    """
    Table specific to accession to defines the synonyms.
    """

    language = models.CharField(
        null=False,
        blank=False,
        max_length=8,
        choices=Languages.choices(),
        default=Languages.EN.value)

    # TODO evolve in a CharField which takes its value from a specific descriptor added by fixtures
    # Fix this descriptor code as ID_001
    type = models.IntegerField(null=False, blank=False, choices=AccessionSynonymType.choices())

    class Meta:
        verbose_name = _("accession synonym")


class DescriptorPanel(Entity):
    """
    A panel is a displayable entity that is a association of values of descriptors.
    It is only defined for a specific model of descriptor (one to many relation).
    There is many panels per model of descriptor.
    It has many types of models of descriptors. For example we can have a general panel,
    a passport panel...
    Panels are created and modified by staff people.
    The textual resources of a panel are i18nable because they are displayed for users.
    """

    # Label of the panel (can be used for a tab, or any dialog title).
    # It is i18nized used JSON dict with language code as key and label as value (string:string).
    label = models.TextField(null=False, default={})

    # Position priority into the display. Lesser is before. Negative value are possibles.
    position = models.IntegerField(null=False, default=0)

    class Meta:
        verbose_name = _("descriptor panel")

    def get_label(self):
        """
        Get the label for this panel in the current regional.
        """
        data = json.loads(self.label)
        lang = translation.get_language()

        return data.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        data = json.loads(self.label)
        data[lang] = label
        self.label = json.dumps(data)


class DescriptorModelType(models.Model):
    """
    This is a basic entity of the model of descriptor. It makes the relation between a panel and
    its descriptors. And it makes the relation between him and the model of descriptor.
    """

    # Relate the descriptor model (one descriptor model can have many descriptor model types)
    descriptor_model = models.ForeignKey('DescriptorModel', related_name='descriptors_types')

    # Related type of descriptor (relate on a specific one's)
    descriptor_type = models.ForeignKey(DescriptorType, null=False, blank=False)

    # True if this type of descriptor is mandatory for an accession (model)
    mandatory = models.BooleanField(null=False, blank=False, default=False)

    # Set once, read many means that the value of the descriptor can be set only at creation
    set_once = models.BooleanField(null=False, blank=False, default=False)

    # Related panel of descriptors
    panel = models.ForeignKey(DescriptorPanel, null=False, blank=False)


class DescriptorModel(Entity):
    """
    A model of descriptor is like a template of descriptor that is related to a kind of accession.
    Many accession can share the same model of descriptors.
    """

    # Verbose name describing the model of descriptor. There is no translation for this
    # name because it is used internally by staff.
    verbose_name = models.CharField(null=False, max_length=255, default="")

    # Textual description of the model of descriptor. There is no translation like the verbose name.
    description = models.TextField(null=False, default="")

    class Meta:
        verbose_name = _("descriptor model")


class Asset(Entity):
    """
    Defines a collection of accessions, with particular permissions on it.
    """

    accessions = models.ManyToManyField('Accession', related_name='assets')

    class Meta:
        verbose_name = _("panel")


class Accession(Entity):
    """
    Accession entity.
    """

    descriptors = HStoreField()

    # Can have many synonyms, and some synonyms can sometimes be shared by multiples accessions.
    synonyms = models.ManyToManyField(AccessionSynonym, related_name='accessions')

    # Model of accession refers to a model of type of descriptors related to a specific accession
    descriptor_model = models.ForeignKey(DescriptorModel, related_name='accessions')

    class Meta:
        verbose_name = _("accession")


class Batch(Entity):
    """
    Lot for an accession.
    """

    accession = models.ForeignKey('Accession', null=False, related_name='bundles')

    descriptors = HStoreField()

    class Meta:
        verbose_name = _("batch")


class Sample(models.Model):
    """
    Sample during lot processing.
    """

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)
    batch = models.ForeignKey('Batch', null=False, related_name='samples')

    descriptors = HStoreField()

    class Meta:
        verbose_name = _("sample")
