from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('proyectoapp', '0001_initial'),  # deja la misma dependencia que tenía
    ]
    operations = [
        # No hacemos nada: el rename ya se manejó manualmente
        migrations.SeparateDatabaseAndState(state_operations=[], database_operations=[]),
    ]
