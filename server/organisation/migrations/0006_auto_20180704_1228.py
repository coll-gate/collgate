# Generated by Django 2.0.4 on 2018-07-04 10:28

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('organisation', '0005_auto_20180626_1430'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conservatory',
            name='comments',
            field=django.contrib.postgres.fields.jsonb.JSONField(default={}),
        ),
        migrations.AlterField(
            model_name='establishment',
            name='comments',
            field=django.contrib.postgres.fields.jsonb.JSONField(default={}),
        ),
        migrations.AlterField(
            model_name='organisation',
            name='comments',
            field=django.contrib.postgres.fields.jsonb.JSONField(default={}),
        ),
        migrations.AlterField(
            model_name='person',
            name='comments',
            field=django.contrib.postgres.fields.jsonb.JSONField(default={}),
        ),
    ]
