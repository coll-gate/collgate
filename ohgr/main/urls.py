# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
ohgr.main url entry point.
Any module containing URL handler must be imported
into this module.
"""

from django.conf.urls import include, url

urlpatterns = [
    # i18n
    url(r'^i18n/',
        include('django.conf.urls.i18n',
                namespace='i18n',
                app_name='i18n')),
]
