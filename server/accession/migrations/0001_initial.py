# Generated by Django 2.0.2 on 2018-02-08 08:50

import django.contrib.postgres.fields
import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Accession',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_status', models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Archived'), (3, 'Removed')], default=1)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('descriptors', django.contrib.postgres.fields.jsonb.JSONField(default={})),
                ('name', models.CharField(db_index=True, max_length=255)),
                ('code', models.CharField(db_index=True, max_length=255, unique=True)),
            ],
            options={
                'verbose_name': 'accession',
                'permissions': (('get_accession', 'Can get an accession'), ('list_accession', 'Can list accessions'), ('search_accession', 'Can search for accessions')),
            },
        ),
        migrations.CreateModel(
            name='AccessionClassificationEntry',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('primary', models.BooleanField(db_index=True, default=False)),
            ],
        ),
        migrations.CreateModel(
            name='AccessionPanel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_status', models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Archived'), (3, 'Removed')], default=1)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('name', models.CharField(db_index=True, max_length=255, unique=True)),
                ('descriptors', django.contrib.postgres.fields.jsonb.JSONField(default={})),
            ],
            options={
                'verbose_name': 'accession panel',
                'permissions': (('get_accessionpanel', 'Can get a accession panel'), ('list_accessionpanel', 'Can list accession panel')),
            },
        ),
        migrations.CreateModel(
            name='AccessionSynonym',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_status', models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Archived'), (3, 'Removed')], default=1)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('name', models.CharField(db_index=True, max_length=128)),
                ('language', models.CharField(blank=True, default='', max_length=5)),
            ],
            options={
                'verbose_name': 'accession synonym',
            },
        ),
        migrations.CreateModel(
            name='Action',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_status', models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Archived'), (3, 'Removed')], default=1)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('data', django.contrib.postgres.fields.jsonb.JSONField(default={'status': 'created'})),
            ],
            options={
                'verbose_name': 'action',
                'default_permissions': [],
            },
        ),
        migrations.CreateModel(
            name='ActionType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_status', models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Archived'), (3, 'Removed')], default=1)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('name', models.CharField(db_index=True, max_length=128, unique=True)),
                ('label', django.contrib.postgres.fields.jsonb.JSONField(default={})),
                ('format', django.contrib.postgres.fields.jsonb.JSONField(default={'steps': []})),
                ('description', models.TextField(blank=True, default='')),
            ],
            options={
                'verbose_name': 'batch action type',
            },
        ),
        migrations.CreateModel(
            name='Batch',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_status', models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Archived'), (3, 'Removed')], default=1)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('descriptors', django.contrib.postgres.fields.jsonb.JSONField(default={})),
                ('name', models.CharField(db_index=True, max_length=255, unique=True)),
            ],
            options={
                'verbose_name': 'batch',
                'permissions': (('get_batch', 'Can get a batch'), ('list_batch', 'Can list batch'), ('search_batch', 'Can search for batches')),
                'default_related_name': 'batches',
            },
        ),
        migrations.CreateModel(
            name='BatchPanel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_status', models.IntegerField(choices=[(0, 'Pending'), (1, 'Valid'), (2, 'Archived'), (3, 'Removed')], default=1)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('name', models.CharField(db_index=True, max_length=255, unique=True)),
                ('descriptors', django.contrib.postgres.fields.jsonb.JSONField(default={})),
                ('batches', models.ManyToManyField(to='accession.Batch')),
                ('content_type', models.ForeignKey(editable=False, on_delete=django.db.models.deletion.PROTECT, to='contenttypes.ContentType')),
            ],
            options={
                'verbose_name': 'batch panel',
                'permissions': (('get_batchpanel', 'Can get a batch panel'), ('list_batchpanel', 'Can list batch panel')),
            },
        ),
    ]
