#!/bin/bash

echo "🚀 Iniciando aplicación en Railway..."

echo "📊 Ejecutando migraciones..."
python manage.py migrate --noinput

echo "📁 Recopilando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🟢 Iniciando servidor..."
exec gunicorn colegio.wsgi:application --bind 0.0.0.0:8080 --workers 2 --timeout 120
