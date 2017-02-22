# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate geolocation module models.
"""

from django.db import models


class Base(models.Model):
    """
    Geoname base model
    """
    geoname_id = models.IntegerField(null=True, blank=True, unique=True)
    latitude = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True)
    longitude = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True)
    alt_names = models.ManyToManyField('AlternateName')

    class Meta():
        abstract = True
        ordering = ['name', 'id']

class AlternateName(models.Model):
    """
    Alternate names model
    """
    language = models.CharField(max_length=2, null=False)
    alternate_name = models.TextField(null=True, blank=True, default='')


class Country(Base):
    """
    Country model.
    """
    name = models.CharField(max_length=200, unique=True)

    code2 = models.CharField(max_length=2, null=True, blank=True, unique=True)
    code3 = models.CharField(max_length=3, null=True, blank=True, unique=True)
    continent = models.CharField(max_length=2, db_index=True)
    phone = models.CharField(max_length=20, null=True, blank=True)


class Region(Base):
    """
    Region/State model.
    """
    name = models.CharField(max_length=200, db_index=True)
    # display_name = models.CharField(max_length=200)
    geoname_code = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)


class City(Base):
    """
    City model.
    """
    name = models.CharField(max_length=200, db_index=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    population = models.BigIntegerField(null=True, blank=True, db_index=True)
    feature_code = models.CharField(max_length=10, null=True, blank=True, db_index=True)

class Point(models.Model):
    """
    Geolocation point model
    """
    latitude = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True)
    longitude = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True)

    country = models.ForeignKey(Country, null=True)
    city = models.ForeignKey(City, null=True)