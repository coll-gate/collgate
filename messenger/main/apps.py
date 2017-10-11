# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate messenger main application
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from igdectk.common.apphelpers import ApplicationMain


class CollGateMessengerMain(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateMessengerMain, self).__init__(app_name, app_module)

    def ready(self):
        super().ready()
