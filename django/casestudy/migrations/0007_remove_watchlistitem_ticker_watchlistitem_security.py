# Generated by Django 4.2 on 2024-05-27 03:40

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('casestudy', '0006_rename_user_id_watchlistitem_user_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='watchlistitem',
            name='ticker',
        ),
        migrations.AddField(
            model_name='watchlistitem',
            name='security',
            field=models.ForeignKey(default='bleh', on_delete=django.db.models.deletion.CASCADE, to='casestudy.security'),
            preserve_default=False,
        ),
    ]
