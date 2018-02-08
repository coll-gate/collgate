# -*- coding: utf-8; -*-
#
# @file urls.py
# @brief coll-gate main url entry point.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.conf.urls import include, url

urlpatterns = [
    # i18n
    url(r'^i18n/', include(('django.conf.urls.i18n', 'i18n'), namespace='i18n')),
]
