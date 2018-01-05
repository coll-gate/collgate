# -*- coding: utf-8 -*-
# Generated by Django 1.11.6 on 2018-01-05 12:40
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('medialibrary', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='media',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='media',
            name='owner_content_type',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='contenttypes.ContentType'),
        ),
    ]
