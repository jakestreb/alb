import os
import requests
import time
from celery import Celery
from celery.schedules import crontab
from django.conf import settings
from datetime import datetime
from casestudy.settings import DATABASES, INSTALLED_APPS

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "casestudy.settings")

app = Celery("casestudy")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
