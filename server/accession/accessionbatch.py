# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate accession batch rest handler
"""

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from descriptor.describable import DescriptorsBuilder
from descriptor.models import DescriptorMetaModel
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.models import Languages, EntityStatus
from permission.utils import get_permissions_for
from taxonomy.models import Taxon

from .models import Accession, Batch
from .base import RestAccession
from .accession import RestAccessionId

from django.utils.translation import ugettext_lazy as _


class RestAccessionIdBatch(RestAccessionId):
    regex = r'^batch/$'
    name = 'batch'


class RestAccessionIdBatchSearch(RestAccessionIdBatch):
    regex = r'^search/$'
    suffix = 'search'


