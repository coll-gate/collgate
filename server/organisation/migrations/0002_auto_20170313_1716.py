# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-03-13 16:16
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organisation', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='organisation',
            name='type',
            field=models.CharField(default='OR_001:0000001', max_length=16),
        ),
    ]
