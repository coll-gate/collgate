# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-03-17 16:08
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organisation', '0002_auto_20170313_1716'),
    ]

    operations = [
        migrations.AlterField(
            model_name='grc',
            name='identifier',
            field=models.CharField(default='undefined', max_length=255),
        ),
        migrations.AlterField(
            model_name='grc',
            name='name',
            field=models.CharField(default='Undefined GRC', max_length=255),
        ),
    ]