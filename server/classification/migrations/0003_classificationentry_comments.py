# Generated by Django 2.0.4 on 2018-06-26 13:04

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('classification', '0002_auto_20180208_0950'),
    ]

    operations = [
        migrations.AddField(
            model_name='classificationentry',
            name='comments',
            field=django.contrib.postgres.fields.jsonb.JSONField(default=[]),
        ),
    ]