# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-14 17:02
from __future__ import unicode_literals

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import re
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('accession', '0002_auto_20161013_1439'),
    ]

    operations = [
        migrations.AddField(
            model_name='descriptormodeltype',
            name='content_type',
            field=models.ForeignKey(default=16, editable=False, on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='descriptormodeltype',
            name='created_date',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='descriptormodeltype',
            name='entity_status',
            field=models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Hidden'), (3, 'Removed')], default=1),
        ),
        migrations.AddField(
            model_name='descriptormodeltype',
            name='modified_date',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='descriptormodeltype',
            name='name',
            field=models.CharField(db_index=True, default='ID_001:0:0', max_length=255, unique=True, validators=[django.core.validators.RegexValidator(code='invalid_name', message='Name must contains only alphanumerics characters or _ or - and be at least 3 characters length', regex=re.compile('^[a-zA-Z0-9_-]{3,}$', 34))]),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='descriptormodeltype',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
