# -*- coding: utf-8 -*-
# Generated by Django 1.9.7 on 2016-08-08 15:05
from __future__ import unicode_literals

import datetime
from django.db import migrations, models
import django.db.models.deletion
from django.utils.timezone import utc
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('accession', '0006_auto_20160808_1651'),
    ]

    operations = [
        migrations.AddField(
            model_name='accessionsynonym',
            name='content_type',
            field=models.ForeignKey(default=16, editable=False, on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='accessionsynonym',
            name='created_date',
            field=models.DateTimeField(auto_now_add=True, default=datetime.datetime(2016, 8, 8, 15, 4, 55, 957574, tzinfo=utc)),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='accessionsynonym',
            name='entity_status',
            field=models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Hidden'), (3, 'Removed')], default=1),
        ),
        migrations.AddField(
            model_name='accessionsynonym',
            name='modified_date',
            field=models.DateTimeField(auto_now=True, default=datetime.datetime(2016, 8, 8, 15, 5, 1, 77908, tzinfo=utc)),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='accessionsynonym',
            name='name',
            field=models.CharField(db_index=True, default='', max_length=255, unique=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='accessionsynonym',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
