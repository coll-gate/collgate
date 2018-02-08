# -*- coding: utf-8; -*-
#
# @file __init__.py
# @brief Application Django base url
# @authors Frédéric SCHERMA (INRA UMR1095)
# @date 2016-01-22
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.conf.urls import include, url
from django.conf import settings

# from django.contrib.staticfiles.views import serve as serve_static
# from django.views.decorators.cache import never_cache, cache_control, cache_page

urlpatterns = [
    # url(r'^robots\.txt$',
    #     'django.views.generic.simple.direct_to_template', {
    #       'template': 'robots.txt',
    #       'mimetype': 'text/plain'}),
]

# if settings.DEBUG:
#     urlpatterns += [
#         url(r'^static/(?P<path>.*)$', cache_control(maxage=60*60*24)(serve_static)),
#     }

# debug only
if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    import debug_toolbar
    urlpatterns += [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ]

# admin
if 'django.contrib.admin' in settings.INSTALLED_APPS:
    from django.contrib import admin
    admin.autodiscover()

    urlpatterns += [
        url(r'^coll-gate/admin/', admin.site.urls),
        # url(r'^coll-gate/admin/doc/', include('django.contrib.admindocs.urls')),
        # url(r'^coll-gate/admin/password_reset/$',
        #     'django.contrib.auth.views.password_reset',
        #     name='admin_password_reset'),

        # url(r'^coll-gate/admin/password_reset/done/$', 'django.contrib.auth.views.password_reset_done'),
    ]
