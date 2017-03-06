# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation establishment model REST API
"""

from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.module.manager import module_manager


from .base import RestOrganisationModule
from .organisation import RestOrganisation


class RestEstablishment(RestOrganisationModule):
    regex = r'^establishment/$'
    name = 'establishment'


class RestOrganisationIdEstablishment(RestOrganisation):
    regex = r'^establishment/$'
    suffix = 'establishment'

