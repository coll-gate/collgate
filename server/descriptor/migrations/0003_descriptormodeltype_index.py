# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-04-24 09:58
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('descriptor', '0002_auto_20170315_1540'),
    ]

    operations = [
        migrations.AddField(
            model_name='descriptormodeltype',
            name='index',
            field=models.IntegerField(choices=[(0, 'None'), (1, 'Unique-BTree'), (2, 'BTree'), (3, 'Unique-GIN'), (4, 'GIN'), (5, 'Unique-GIST'), (6, 'GIST')], default=0),
        ),
    ]