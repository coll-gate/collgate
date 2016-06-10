"""
Django settings for ohgr project.

For more information on this file, see
https://docs.djangoproject.com/en/1.9/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.9/ref/settings/
"""

import sys
from os.path import dirname, join, realpath

DEBUG = True

ADMINS = (
    ('admin_fscherma', 'frederic.scherma@clermont.inra.fr'),
    ('admin_nguilhot', 'nicolas.guilhot@clermont.inra.fr'),
)

MANAGERS = ADMINS

# Hosts/domain names that are valid for this site; required if DEBUG is False
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'Europe/Paris'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-US'

ugettext = lambda s: s

LANGUAGES = (
  ('fr', ugettext('French')),
  ('en', ugettext('English')),
)

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/var/www/example.com/media/"

BASE_DIR = dirname(dirname(__file__))
MEDIA_ROOT = join(BASE_DIR, 'media')
MAX_UPLOAD_SIZE = 3145728  # 3Mio
CONTENT_TYPES = ['text/plain']

BASE_DIR = dirname(dirname(__file__))
# Append the path of the parent of 'common' project
sys.path.insert(0, realpath(join(BASE_DIR, "..", "..")))

# LOCALE_PATHS = [join(BASE_DIR, "locale"), ]

MEDIA_ROOT = BASE_DIR

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://example.com/media/", "http://media.example.com/"
MEDIA_URL = 'media/'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = 'static/'

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'igdectk.packager.finders.AppDirectoriesFinder'
    # 'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    # 'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'tqz1=9-yx395l*-&47!&yixn!itl6rq6ih_sdp140u2a#evy#_'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'APP_DIRS': False,
        'OPTIONS': {
            'debug': True,
            'context_processors': (
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
                'igdectk.module.context_processors.module',
            ),
            # List of callables that know how to import templates from various sources.
            'loaders': (
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
                # 'django.template.loaders.eggs.Loader',
            ),
        },
    },
]

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'igdectk.rest.csrf.CsrfViewMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'igdectk.rest.restmiddleware.IGdecTkRestMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

AUTHENTICATION_BACKENDS = (
    'igdectk.auth.ldap.LdapAuthenticationBackend',
    # 'django.contrib.auth.backends.ModelBackend'
    'guardian.backends.ObjectPermissionBackend',
)

LDAPS = {
    'default': {
        'HOST': "ldap.clermont.inra.fr",
        'USER_DN': "uid=%s,ou=clermont-ferrand,ou=personnes,dc=inra,dc=fr",
        'OPTIONS': {
            'auto_add_user': True,
            'search_filter': "(unite=*)",
            'email_fields': ['mail', 'mailSynthese'],
            'state_fields': {'etatFicheLdap': 'actif'},
            'firstname_fields': ['givenName'],
            'lastname_fields': ['sn'],
        }
    },
}

ROOT_URLCONF = 'urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'wsgi.application'

# BOOTSTRAP3 = {
#     'include_jquery': False,
#     'jquery_url': '/static/promoteranalysis/js/jquery.min.js',
#     'base_url': '/static/promoteranalysis/js/',
#     'css_url': '/static/promoteranalysis/css/bootstrap.min.css',
#     'theme_url': '/static/promoteranalysis/css/bootstrap-theme.min.css',
#     'javascript_url': '/static/promoteranalysis/js/bootstrap.min.js',
# }

INSTALLED_APPS = (
    'bootstrap3',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # 'django.contrib.admin',
    # 'django.contrib.admindocs',
    'guardian',
    'igdectk.common',
    'igdectk.jquery',
    'igdectk.bootstrap',
    'main',
    'permission',
    'audit',
    'taxonomy',
    'accession',
)

APPLICATIONS = {
    "igdectk.jquery": {
        "DB_DEFAULT_SETTINGS": {
            "ui": {"default_theme": "lightness"},
            "fancytree": {
                "default_version": "2.12.0",
                "default_theme": "bootstrap",
                ".glyph": {"default_version": "2.12.0"},
            },
            "select2": {
                "default_version": "3.5.4",
                ".bootstrap": {"default_version": "3.5.4"},
            },
        },
    },
    "igdectk.bootstrap": {
        "DB_DEFAULT_SETTINGS": {
            "bootstrap": {"default_version": "3.3.6"},
        },
    },
}

SESSION_SERIALIZER = 'django.contrib.sessions.serializers.JSONSerializer'

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
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
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'WARNING',
            'propagate': True,
        },
    }
}

TEST_RUNNER = 'django.test.runner.DiscoverRunner'

DEFAULT_FROM_EMAIL = "frederic.scherma@clermont.inra.fr"
EMAIL_HOST = "smtp.clermont.inra.fr"
EMAIL_PORT = 25
EMAIL_SUBJECT_PREFIX = "Online Host of Genetics Resources"

# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
#         'LOCATION': '/var/tmp/django_cache',
#     }
# }
