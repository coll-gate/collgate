# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
ohgr taxonomy module models.
"""

from django.db import models
from django.contrib.auth.models import User

import mongoengine

from mongoengine.fields import (
    Document, DateTimeField, EmbeddedDocument, FloatField, IntField, StringField, ObjectId, ListField, ReferenceField
)


class Taxon(Document):

    TAXON_FAMILY = 60
    TAXON_SUB_FAMILY = 61
    TAXON_GENRE = 70
    TAXON_SUB_GENRE = 71
    TAXON_SPECIE = 80
    TAXON_SUB_SPECIE = 81

    TAXON_LEVEL = (
        (TAXON_FAMILY, TAXON_FAMILY),
        (TAXON_SUB_FAMILY, TAXON_SUB_FAMILY),
        (TAXON_GENRE, TAXON_GENRE),
        (TAXON_SUB_GENRE, TAXON_SUB_GENRE),
        (TAXON_SPECIE, TAXON_SPECIE),
        (TAXON_SUB_SPECIE, TAXON_SUB_SPECIE),
    )

    name = StringField(unique=True)
    level = IntField(null=False, choices=TAXON_LEVEL)

    parent = ReferenceField('Taxon', reverse_delete_rule=mongoengine.DENY)
    parent_list = ListField(ReferenceField('Taxon', reverse_delete_rule=mongoengine.DENY))
