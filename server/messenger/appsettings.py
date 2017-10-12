# -*- coding: utf-8; -*-
#
# @file appsettings.py
# @brief coll-gate medialibrary settings
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

# Default settings of the application
APP_DB_DEFAULT_SETTINGS = {
    'messenger_host': "127.0.0.1",
    'messenger_port': 8002,
    'messenger_path': "/coll-gate/messenger/"
}

APP_VERBOSE_NAME = "Coll-Gate :: Messenger"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"  # lookup into the main module

APP_VERSION = (0, 1, 0)
