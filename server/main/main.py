# -*- coding: utf-8; -*-
#
# @file main.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Rest main handler.
"""
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from main.config import configuration


class RestMain(RestHandler):
    regex = r'^main/$'
    name = 'main'


class RestMainConfig(RestMain):
    regex = r'^config/$'
    name = 'config'


@RestMainConfig.def_admin_request(Method.GET, Format.JSON)
def get_config_check_list(request):
    """
    Get the list of checks of configurations.
    """
    item_list = []

    for config in configuration.check_list():
        item_list.append({
            'id': config['name'],
            'module': config['module'],
            'values': config['values']
        })

    return HttpResponseRest(request, item_list)

