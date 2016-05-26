# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Specific developement settings.
"""

import os

from .base import *

DEBUG = True

ADMINS = (
    ('admin_fscherma', 'frederic.scherma@clermont.inra.fr'),
    ('admin_nguilhot', 'nicolas.guilhot@clermont.inra.fr'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'HOST': '',
        'PORT': '',
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ohgr',
        'USER': 'ohgr',
        'PASSWORD': 'ohgr',
        'CONN_MAX_AGE': 86400
    }
}

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# session cookie path
SESSION_COOKIE_PATH = "/ohgr/"
# CRSF cookie path
CSRF_COOKIE_PATH = "/ohgr/"

MAX_UPLOAD_SIZE = 3145728  # 3Mio
CONTENT_TYPES = ['text/plain']

MEDIA_URL = 'media/'

STATIC_ROOT = 'static/'

STATIC_URL = '/static/'

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    # 'debug_toolbar.middleware.DebugToolbarMiddleware',
    'debug_panel.middleware.DebugPanelMiddleware',
    'igdectk.rest.csrf.CsrfViewMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'igdectk.rest.restmiddleware.IGdecTkRestMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

INSTALLED_APPS = (
    'bootstrap3',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    # 'django.contrib.admindocs',
    'guardian',
    'igdectk.common',
    'igdectk.jquery',
    'igdectk.bootstrap',
    'main',
    'permission',
    'taxonomy',
    'accession',
    # 'debug_toolbar',
)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            '()': 'logging.Formatter',
            'format': '[%(asctime)s] <%(levelname)s> %(name)s : %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'colored': {
            '()': 'igdectk.common.logging.ColoredFormatter',
            'format': '[%(asctime)s] <%(levelname)s> %(name)s : %(message)s',
            'datefmt': '%d/%b/%Y %H:%M:%S',
        }
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'colored',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'ohgr.log'),
            'formatter': 'standard',
            'maxBytes': 1024*1024*16,  # 16MB
            'backupCount': 10,
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['mail_admins', 'console'],
            'level': 'WARNING',
            'propagate': True,
        },
        'ohgr': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'igdectk': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        }
    }
}

DEFAULT_FROM_EMAIL = "frederic.scherma@clermont.inra.fr"
EMAIL_HOST = "smtp.clermont.inra.fr"
#EMAIL_USE_TLS = True
EMAIL_PORT = 25  # 465
EMAIL_HOST_USER = "fscherma"
EMAIL_HOST_PASSWORD = ""
#EMAIL_USE_SSL = True
