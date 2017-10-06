# -*- coding: utf-8; -*-
#
# @file demo.py
# @brief Local demo specific settings.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details Specific demo settings.

import os

from .base import *

DEBUG = True

ADMINS = (
    ('admin_fscherma', 'frederic.scherma@inra.fr'),
    ('admin_nguilhot', 'nicolas.guilhot@inra.fr'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'HOST': '127.0.0.1',
        'PORT': '5432',
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'collgate_dev',
        'USER': 'collgate_dev',
        'PASSWORD': 'collgate_dev',
        'CONN_MAX_AGE': 86400
    }
}

ALLOWED_HOSTS = ['147.99.146.242', 'localhost', '127.0.0.1']
INTERNAL_IPS = ['localhost', '127.0.0.1', '147.99.146.242']

# session cookie path
SESSION_COOKIE_PATH = "/coll-gate/"
# CRSF cookie path
CSRF_COOKIE_PATH = "/coll-gate/"

MAX_UPLOAD_SIZE = 3145728  # 3Mio
CONTENT_TYPES = ['text/plain']

MEDIA_URL = 'media/'

STATIC_ROOT = 'static/'

STATIC_URL = '/static/'

MIDDLEWARE = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'debug_toolbar.middleware.DebugToolbarMiddleware',
    # 'debug_panel.middleware.DebugPanelMiddleware',
    'igdectk.rest.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'igdectk.rest.restmiddleware.RestMiddleware',
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
    'channels',
    # 'debug_toolbar',
    # 'debug_panel',
    'guardian',
    # 'django.contrib.admindocs',
    'igdectk.common',
    'igdectk.jquery',
    'igdectk.bootstrap',
    'main',
    'messenger',
    'audit',
    'permission',
    'descriptor',
    'medialibrary',
    'geonames',
    'geolocation',
    'organisation',
    'classification',
    'accession'
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
            'filename': os.path.join(BASE_DIR, 'logs', 'collgate.log'),
            'formatter': 'standard',
            'maxBytes': 1024*1024*16,  # 16MB
            'backupCount': 10,
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['mail_admins', 'console'],
            'level': 'WARNING',
            'propagate': True,
        },
        'collgate': {
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

DEFAULT_FROM_EMAIL = "frederic.scherma@inra.fr"
EMAIL_HOST = "smtp.clermont.inra.fr"
EMAIL_PORT = 25
EMAIL_SUBJECT_PREFIX = "Coll-Gate IS"

# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
#     }
# }
