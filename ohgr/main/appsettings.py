# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr application settings
"""

# Default settings of the application
APP_DB_DEFAULT_SETTINGS = {
    "emailer": '"frederic.scherma@clermont.inra.fr"',
}

APP_VERBOSE_NAME = "Online Host of Genetic Resource Main"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"

APP_VERSION = (0, 1, 0)
