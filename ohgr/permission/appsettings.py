# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr permission settings
"""

# Default settings of the application
APP_DB_DEFAULT_SETTINGS = {
}

APP_VERBOSE_NAME = "Online Host of Genetic Resource Main :: Permission"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"  # lookup into the main module

APP_VERSION = (0, 1, 0)
