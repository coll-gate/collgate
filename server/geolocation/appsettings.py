# -*- coding: utf-8; -*-
#
# @file appsettings.py
# @brief 
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details coll-gate geolocation settings

# Default settings of the application
APP_DB_DEFAULT_SETTINGS = {
    'geolocation_manager': "geonames.geolocationmanager.GeolocationManager",
}

APP_VERBOSE_NAME = "Coll-Gate :: Geolocation"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"  # lookup into the main module

APP_VERSION = (0, 1, 0)
