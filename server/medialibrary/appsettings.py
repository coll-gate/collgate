# -*- coding: utf-8; -*-
#
# @file appsettings.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate medialibrary settings
"""

# Default settings of the application
APP_DB_DEFAULT_SETTINGS = {
    'storage_location': '"/coll-gate/storage"',
    'storage_path': '"media"',
    'max_file_size': 16*1024*1024
}

APP_VERBOSE_NAME = "Coll-Gate :: Media Library"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"  # lookup into the main module

APP_VERSION = (0, 1, 0)

