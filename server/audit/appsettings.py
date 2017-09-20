# -*- coding: utf-8; -*-
#
# @file appsettings.py
# @brief coll-gate application settings
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

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
