# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr main url registration.
"""

from django.conf.urls import include, url
from django.views.generic import RedirectView
from django.conf import settings

from igdectk.rest.handler import RestHandler

urlpatterns = [
    # chromium favicon fix
    url(r'^favicon\.ico$',
        RedirectView.as_view(url=settings.STATIC_URL+'img/favicon.ico', permanent=True)),

    # url(r'^robots\.txt$',
    #     'django.views.generic.simple.direct_to_template', {
    #       'template': 'robots.txt',
    #       'mimetype': 'text/plain'}),

    # ohgr application
    url(r'^ohgr/',
        include('main.urls',
                namespace='main',
                app_name='main')),
]

# debug only
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ]

# admin
if 'django.contrib.admin' in settings.INSTALLED_APPS:
    from django.contrib import admin
    admin.autodiscover()

    urlpatterns += [
        url(r'^ohgr/admin/',
            include(admin.site.urls)),

        # url(r'^ohgr/admin/doc/',
        #     include('django.contrib.admindocs.urls')),

        # url(r'^ohgr/admin/password_reset/$',
        #     'django.contrib.auth.views.password_reset',
        #     name='admin_password_reset'),

        # url(r'^ohgr/admin/password_reset/done/$',
        #     'django.contrib.auth.views.password_reset_done'),
    ]

RestHandler.register_urls()
