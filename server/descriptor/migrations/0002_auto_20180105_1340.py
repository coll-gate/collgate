# -*- coding: utf-8 -*-
# Generated by Django 1.11.6 on 2018-01-05 12:40
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('descriptor', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='descriptorgroup',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='descriptormetamodel',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='descriptormetamodel',
            name='target',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, related_name='descriptor_meta_models', to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='descriptormodel',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='descriptormodeltype',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='descriptormodeltype',
            name='descriptor_model',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='descriptor_model_types', to='descriptor.DescriptorModel'),
        ),
        migrations.AlterField(
            model_name='descriptormodeltype',
            name='descriptor_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='descriptor_model_types', to='descriptor.DescriptorType'),
        ),
        migrations.AlterField(
            model_name='descriptormodeltypecondition',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='descriptorpanel',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='descriptorpanel',
            name='descriptor_meta_model',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='panels', to='descriptor.DescriptorMetaModel'),
        ),
        migrations.AlterField(
            model_name='descriptorpanel',
            name='descriptor_model',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='panels', to='descriptor.DescriptorModel'),
        ),
        migrations.AlterField(
            model_name='descriptortype',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
        migrations.AlterField(
            model_name='descriptortype',
            name='group',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='types_set', to='descriptor.DescriptorGroup'),
        ),
        migrations.AlterField(
            model_name='descriptorvalue',
            name='content_type',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType'),
        ),
    ]