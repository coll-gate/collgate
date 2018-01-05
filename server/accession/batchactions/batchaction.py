# -*- coding: utf-8; -*-
#
# @file batchaction
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-05
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession.base import RestAccession
from accession.batchactiontypeformat import BatchActionTypeFormatManager
from accession.models import BatchAction, Accession, BatchActionType

from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from rest.response import HttpResponseRest


class RestBatchAction(RestAccession):
    regex = r'^batchaction/$'
    name = 'batchaction'


@RestBatchAction.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": BatchAction.NAME_VALIDATOR,
            "accession": {"type": "number"},
            "type": {"type": "number"}
        },
    }, perms={
        'accession.add_batchaction': _("You are not allowed to create an action for a batch")
    }
)
def create_batch_action(request):
    accession_id = int_arg(request.data.get('accession'))
    batch_action_type_id = int_arg(request.data.get('type'))

    user = request.user

    accession = get_object_or_404(Accession, pk=accession_id)
    batch_action_type = get_object_or_404(BatchActionType, pk=batch_action_type_id)

    # format type might be 'creation'
    # batchaction_type_format = BatchActionTypeFormatManager.get(batchaction_type.format.get('type'))

    batch_action = BatchAction()
    batch_action.type = batch_action_type
    batch_action.user = user
    batch_action.accession = accession
    batch_action.data = {'status': 'created'}

    batch_action.save()

    result = {
        'id': batch_action.pk,
        'accession': accession_id,
        'user': user.username,
        'type': batch_action.type_id
    }

    return HttpResponseRest(request, result)
