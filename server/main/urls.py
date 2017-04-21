# -*- coding: utf-8; -*-
#
# @file urls.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate main url entry point.
"""

from django.conf.urls import include, url
from django.views.i18n import javascript_catalog, json_catalog

urlpatterns = [
    # i18n
    url(r'^i18n/',
        include('django.conf.urls.i18n',
                namespace='i18n',
                app_name='i18n')),
    # javascript i18n catalog
    url(r'^jsi18n/(?P<packages>\S+?)/(?P<domain>\S+?)/$', javascript_catalog, name='javascript-catalog',),
    # json i18n catalog
    url(r'^jsoni18n/(?P<packages>\S+?)/(?P<domain>\S+?)/$', json_catalog, name='json-catalog',),
]

