# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-09-30 12:07
from __future__ import unicode_literals

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import re
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('accession', '0011_auto_20160929_1804'),
    ]

    operations = [
        migrations.CreateModel(
            name='DescriptorMetaModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_status', models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Hidden'), (3, 'Removed')], default=1)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(db_index=True, max_length=255, unique=True, validators=[django.core.validators.RegexValidator(code='invalid_name', message='Name must contains only alphanumerics characters or _ or - and be at least 3 characters length', regex=re.compile('^[a-zA-Z0-9_-]{3,}$', 34))])),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('label', models.TextField(default={})),
                ('description', models.TextField(blank=True, default='')),
                ('content_type', models.ForeignKey(editable=False, on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType')),
                ('descriptor_models', models.ManyToManyField(related_name='descriptor_meta_model', to='accession.DescriptorModel')),
            ],
            options={
                'verbose_name': 'descriptor meta model',
            },
        ),
        migrations.RemoveField(
            model_name='accession',
            name='descriptor_model',
        ),
        migrations.RemoveField(
            model_name='descriptormodeltype',
            name='panel',
        ),
        migrations.AddField(
            model_name='descriptorvalue',
            name='code',
            field=models.CharField(default=0, max_length=64),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='accessionsynonym',
            name='type',
            field=models.CharField(default='ID_001:0000001', max_length=64),
        ),
        migrations.AlterUniqueTogether(
            name='descriptorvalue',
            unique_together=set([('code', 'language'), ('descriptor', 'language')]),
        ),
        migrations.AlterIndexTogether(
            name='descriptorvalue',
            index_together=set([('descriptor', 'language', 'ordinal'), ('code', 'language'), ('descriptor', 'language'), ('descriptor', 'language', 'value1'), ('descriptor', 'language', 'value0')]),
        ),
        migrations.AddField(
            model_name='accession',
            name='descriptor_meta_model',
            field=models.ForeignKey(default=0, on_delete=django.db.models.deletion.CASCADE, related_name='accessions', to='accession.DescriptorMetaModel'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='batch',
            name='descriptor_meta_model',
            field=models.ForeignKey(default=0, on_delete=django.db.models.deletion.CASCADE, related_name='batches', to='accession.DescriptorMetaModel'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='descriptorpanel',
            name='descriptor_meta_model',
            field=models.ForeignKey(default=0, on_delete=django.db.models.deletion.CASCADE, related_name='panels', to='accession.DescriptorMetaModel'),
            preserve_default=False,
        ),
    ]