# -*- coding: utf-8; -*-
#
# @file models.py
# @brief 
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate geolocation module models.
"""

from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericRelation


class AlternateName(models.Model):
    """
    Alternate names model
    """
    alt_name_id = models.IntegerField(unique=True, db_index=True, null=False, blank=False)
    language = models.CharField(max_length=2, null=False)
    alternate_name = models.CharField(max_length=255, null=True, blank=True, default='')
    is_preferred_name = models.BooleanField(default=False)
    is_short_name = models.BooleanField(default=False)

    # polymorphic database relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return "(%s -> %s, %s, preferred : %s, short : %s)" % (self.alt_name_id, self.language, self.alternate_name,
                                                               self.is_preferred_name, self.is_short_name)

    class Meta:
        unique_together = ['alt_name_id', 'language', 'alternate_name']


class Base(models.Model):
    """
    Geoname base model
    """
    geoname_id = models.IntegerField(null=False, blank=False, unique=True, db_index=True)
    latitude = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True)
    longitude = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True)
    name = models.CharField(max_length=200, db_index=True)
    alt_names = GenericRelation(AlternateName)

    class Meta:
        abstract = True
        ordering = ['name', 'id']

    def __str__(self):
        return str(self.geoname_id) + ' ' + str(self.name)


class Country(Base):
    """
    Country model.
    """
    code2 = models.CharField(max_length=2, null=True, blank=True, unique=True, db_index=True)
    code3 = models.CharField(max_length=3, null=True, blank=True, unique=True, db_index=True)
    continent = models.CharField(max_length=2, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)


class City(Base):
    """
    City model.
    """
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    population = models.BigIntegerField(null=True, blank=True)
    feature_code = models.CharField(max_length=10, null=True, blank=True, db_index=True)


class State(models.Model):
    """
    Application state model
    """
    source = models.CharField(max_length=1024, null=False, blank=False, unique=True, db_index=True)
    last_modified = models.DateTimeField(null=False, blank=False)
    size = models.BigIntegerField(null=True, blank=True)

