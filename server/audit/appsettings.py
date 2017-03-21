# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate application settings
"""

# Default settings of the application
APP_DB_DEFAULT_SETTINGS = {
}

APP_VERBOSE_NAME = "Coll-Gate :: Audit"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"

APP_VERSION = (0, 1, 0)

AUDIT_MIGRATION = {
    'AUDIT': True,          # correspond to environment variable COLLGATE_MIGRATION_AUDIT
    'USERNAME': "root"      # correspond to environment variable COLLGATE_MIGRATION_AUDIT_USERNAME
}
