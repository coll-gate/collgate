# Generated by Django 2.0.2 on 2018-02-15 13:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accession', '0004_auto_20180214_1557'),
    ]

    operations = [
        migrations.AddField(
            model_name='action',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
    ]
