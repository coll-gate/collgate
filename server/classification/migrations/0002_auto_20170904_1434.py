# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-09-04 12:34
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('classification', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='classification',
            name='can_delete',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='classification',
            name='can_modify',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='classification',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
    ]
