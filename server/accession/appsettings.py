# -*- coding: utf-8; -*-
#
# @file appsettings.py
# @brief coll-gate accession settings
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

# Default settings of the application
APP_DB_DEFAULT_SETTINGS = {
    "accession_naming": "{SEQUENCE.6}",
    "batch_naming": "{VAR.ACCESSION_CODE}-{CONST}-{YEAR}-{HASH.3}"
}

APP_VERBOSE_NAME = "Coll-Gate :: Accession"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"  # lookup into the main module

APP_VERSION = (0, 1, 0)
