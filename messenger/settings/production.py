# -*- coding: utf-8; -*-
#
# @file production.py
# @brief Production specific settings.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import os

from .base import *

DEBUG = False

ADMINS = (
    ('admin_fscherma', 'frederic.scherma@inra.fr'),
    ('admin_nguilhot', 'nicolas.guilhot@inra.fr'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'HOST': '',
        'PORT': '',
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'collgate',
        'USER': 'collgate',
        'PASSWORD': 'collgate',
        'CONN_MAX_AGE': 86400
    }
}

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# session cookie path
SESSION_COOKIE_PATH = "/coll-gate/"
# CRSF cookie path
CSRF_COOKIE_PATH = "/coll-gate/"

MAX_UPLOAD_SIZE = 3145728  # 3Mio
CONTENT_TYPES = ['text/plain']

MEDIA_URL = 'media/'

STATIC_ROOT = 'static/'

STATIC_URL = '/static/'

TEMPLATES[0]['OPTIONS']['debug'] = False

MIDDLEWARE = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'igdectk.rest.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'igdectk.rest.restmiddleware.RestMiddleware',
)

INSTALLED_APPS = (
    'django.contrib.postgres',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'igdectk.common',
    'channels',
    'main',
    'tcpserver',
    'printer'
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
            'filename': os.path.join(BASE_DIR, 'logs', 'collgate-messenger.log'),
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
        'collgate-messenger': {
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
#EMAIL_USE_TLS = True
EMAIL_PORT = 25  # 465
EMAIL_HOST_USER = "fscherma"
EMAIL_HOST_PASSWORD = ""
#EMAIL_USE_SSL = True
