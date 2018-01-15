# -*- coding: utf-8; -*-
#
# @file base.py
# @brief coll-gate accession rest handler
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest


class RestAccession(RestHandler):
    regex = r'^accession/$'
    name = 'accession'


class RestAccessionNaming(RestAccession):
    regex = r'^naming/$'
    name = 'naming'


class RestAccessionNamingAccession(RestAccessionNaming):
    regex = r'^accession/$'
    name = 'accession'


class RestAccessionNamingBatch(RestAccessionNaming):
    regex = r'^batch/$'
    name = 'batch'


@RestAccessionNamingAccession.def_auth_request(Method.GET, Format.JSON)
def get_naming_accession(request):
    naming = get_setting('accession', 'accession_naming')

    result = {
        'app_label': 'accession',
        'model': 'accession',
        'format': naming
    }

    return HttpResponseRest(request, result)


@RestAccessionNamingBatch.def_auth_request(Method.GET, Format.JSON)
def get_naming_batch(request):
    naming = get_setting('accession', 'batch_naming')

    result = {
        'app_label': 'accession',
        'model': 'batch',
        'format': naming
    }

    return HttpResponseRest(request, result)
