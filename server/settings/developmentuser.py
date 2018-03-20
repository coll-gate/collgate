# -*- coding: utf-8; -*-
#
# @file developmentuser.py
# @brief Development user specific settings.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-09-25
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from .development import *

LOGGING['loggers']['django.db']['level'] = 'DEBUG'

PURGE_SERVER_CACHE = True

AUDIT_MIGRATION = {
    'USERNAME': "admin"
}
