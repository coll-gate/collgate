# Generated by Django 2.0.4 on 2018-06-19 14:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organisation', '0002_person'),
    ]

    operations = [
        migrations.AddField(
            model_name='person',
            name='code',
            field=models.CharField(db_index=True, default='', max_length=255, unique=True),
            preserve_default=False,
        ),
    ]