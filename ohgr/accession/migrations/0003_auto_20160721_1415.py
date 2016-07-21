# -*- coding: utf-8 -*-
# Generated by Django 1.9.7 on 2016-07-21 12:15
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accession', '0002_auto_20160718_1134'),
    ]

    operations = [
        migrations.CreateModel(
            name='DescriptorValue',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('parents', models.CharField(default='', max_length=255)),
                ('value', models.CharField(max_length=512)),
            ],
        ),
        migrations.AlterField(
            model_name='descriptortype',
            name='group',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='types_set', to='accession.DescriptorGroup'),
        ),
        migrations.AddField(
            model_name='descriptorvalue',
            name='descriptor',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='values_set', to='accession.DescriptorType'),
        ),
    ]
