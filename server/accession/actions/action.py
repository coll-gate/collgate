# -*- coding: utf-8; -*-
#
# @file action
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-05
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import io
import json
import mimetypes

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession import localsettings
from accession.actions.actioncontroller import ActionController
from accession.actions.actiondataexporter import ActionDataExporter
from accession.actions.actiondataparser import ActionDataParser
from accession.actions.actionstepformat import ActionStepFormat
from accession.base import RestAccession
from accession.models import Action, ActionType, ActionToEntity, ActionData, ActionDataType, \
    AccessionPanel, BatchPanel
from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from igdectk.rest.response import HttpResponseRest

ALLOWED_MIMES = (
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain'
)


class RestAction(RestAccession):
    regex = r'^action/$'
    name = 'action'


class RestActionCount(RestAction):
    regex = r'^count/$'
    suffix = 'count'


class RestActionId(RestAction):
    regex = r'^(?P<act_id>[0-9]+)/$'
    suffix = 'id'


class RestActionEntity(RestAction):
    regex = r'^entity/$'
    suffix = 'entity'


class RestActionEntityId(RestActionEntity):
    regex = r'^(?P<ent_id>[0-9]+)/(?P<content_type_name>[a-zA-Z\.-]+)/$'
    suffix = 'id'


class RestActionEntityIdCount(RestActionEntityId):
    regex = r'^count/$'
    suffix = 'count'


class RestActionIdUpload(RestActionId):
    regex = r'^upload/$'
    suffix = 'upload'


class RestActionIdDownload(RestActionId):
    regex = r'^download/$'
    suffix = 'download'


class RestActionIdData(RestActionId):
    regex = r'^data/(?P<step_idx>[0-9]+)/(?P<type_num>[0-9]+)/$'
    suffix = 'data/step-idx/type-num'


class RestActionIdStepIdx(RestActionId):
    regex = r'^step/(?P<step_idx>[0-9]+)/$'
    suffix = 'step/step-idx'


class RestActionIdDone(RestActionId):
    regex = r'^done/$'
    suffix = 'done'


class RestActionIdTodo(RestActionId):
    regex = r'^todo/$'
    suffix = 'todo'


@RestAction.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Action.NAME_VALIDATOR,
            "description": {"type": "string", "minLength": 0, "maxLength": 1024},
            "action_type": {"type": "number"}
        },
    }, perms={
        'accession.add_action': _("You are not allowed to create an action")
    })
def create_action(request):
    action_type_id = int_arg(request.data.get('action_type'))
    name = request.data.get('name')
    description = request.data.get('description', '')
    user = request.user

    action_type = get_object_or_404(ActionType, pk=action_type_id)

    action_controller = ActionController(action_type, user)
    action = action_controller.create(name, description)

    results = {
        'id': action.id,
        'name': action.name,
        'description': action.description,
        'completed': action.completed,
        'user': user.username,
        'action_type': action.action_type_id,
        'data': action.data,
        'created_date': action.created_date.strftime("%Y-%m-%d %H:%M:%S")
    }

    return HttpResponseRest(request, results)


@RestActionId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Action.NAME_VALIDATOR_OPTIONAL,
            "description": {"type": "string", "minLength": 0, "maxLength": 1024, "required": False},
        },
    }, perms={
        'accession.change_action': _("You are not allowed to modify an action")
    })
def update_action(request, act_id):
    action = get_object_or_404(Action, pk=int(act_id))

    name = request.data.get('name')
    description = request.data.get('description')

    result = {'id': action.id}

    if name is not None:
        action.name = name

        result['name'] = name
        action.update_field('name')

    if description is not None:
        action.description = description

        result['description'] = description
        action.update_field('description')

    action.save()

    return HttpResponseRest(request, result)


@RestActionId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ['reset', 'setup', 'process', 'iterate', 'finalize']},  # action of API
            "inputs_type": {"type": "string", "enum": ['none', 'panel', 'list', 'single'], "required": False},
            "panel": {"type": ["integer", "null"], "required": False},
            "list": {"type": "array", "required": False, "minItems": 0, "maxItems": 32768, "additionalItems": {
                    "type": "number"
                }, "items": []},
            "columns": {"type": "array", "required": False, "minItems": 0, "maxItems": 100, "additionalItems": {
                    "type": "string"
                }, "items": []}
        },
    }, perms={
        'accession.change_action': _("You are not allowed to modify an action")
    })
def action_process_step(request, act_id):
    inputs_type = request.data.get('inputs_type')
    action_type = request.data.get('action')
    user = request.user

    action = get_object_or_404(Action, pk=int(act_id))

    # action is completed, nothing more to do
    if action.completed:
        raise SuspiciousOperation(_("This action is already completed"))

    # @todo does we perform a user consistency check on permissions ?

    result = {'id': action.id}

    if action_type == "reset":
        # reset the previously set inputs or options for the current step
        action_controller = ActionController(action)

        if not action_controller.is_current_step_valid:
            raise SuspiciousOperation(_("There is not current valid step to reset"))

        if action_controller.is_current_step_done:
            raise SuspiciousOperation(_("The current step is done"))

        action_controller.reset_current_step()

    elif action_type == "setup":
        # setup the inputs or options for the current step if not done
        action_controller = ActionController(action)

        if not action_controller.is_current_step_valid:
            raise SuspiciousOperation(_("There is not current valid step to setup"))

        if action_controller.is_current_step_done:
            raise SuspiciousOperation(_("The current step is done"))

        if inputs_type == "list":
            # input from a user defined list
            columns = request.data.get('columns', [])

            input_columns = []

            for col in columns:
                if col == 'accession_id':
                    input_columns.append(ActionStepFormat.IO_ACCESSION_ID)
                elif col == 'batch_id':
                    input_columns.append(ActionStepFormat.IO_BATCH_ID)
                elif col == 'descriptor_id':
                    input_columns.append(ActionStepFormat.IO_DESCRIPTOR)
                else:
                    input_columns.append(ActionStepFormat.IO_UNDEFINED)

            input_data = request.data.get('list', [])
        elif inputs_type == "panel":
            # input given a panel
            panel_id = request.data.get('panel')
            panel = None

            input_data = []
            input_columns = []

            try:
                panel = AccessionPanel.objects.get(id=panel_id)
                input_columns.append(ActionStepFormat.IO_ACCESSION_ID)
                input_data = list(panel.accessions.values_list('id', flat=True))
            except AccessionPanel.DoesNotExist:
                pass

            try:
                panel = BatchPanel.objects.get(id=panel_id)
                input_columns.append(ActionStepFormat.IO_BATCH_ID)
                input_data = list(panel.batches.values_list('id', flat=True))
            except BatchPanel.DoesNotExist:
                pass

            if panel is None:
                raise SuspiciousOperation("Panel does not exists")

        elif inputs_type == "none":
            # input none
            input_columns = []
            input_data = None
        else:
            raise SuspiciousOperation("Unsupported setup")

        action_controller.setup_data(input_data, input_columns)

    elif action_type == "process":
        # process the step according the previously set inputs or options and done it
        action_controller = ActionController(action)

        if not action_controller.is_current_step_valid:
            raise SuspiciousOperation(_("There is not current valid step to process"))

        if action_controller.is_current_step_done:
            raise SuspiciousOperation(_("The current step is done"))

        # process and finalize if not iterative
        action_controller.process_current_step()

    elif action_type == "iterate":
        # process one more element at time
        action_controller = ActionController(action)

        if not action_controller.is_current_step_valid:
            raise SuspiciousOperation(_("There is not current valid step to process"))

        if action_controller.is_current_step_done:
            raise SuspiciousOperation(_("The current step is done"))

        if not action_controller.has_iterative_processing:
            raise SuspiciousOperation(_("The current step does not support sequential processing"))

        # which element to process
        element_id = request.data.get('element')

        if not element_id:
            raise SuspiciousOperation(_("The element identifier must be specified"))

        data = [element_id]
        action_controller.process_current_step_once(data)

    elif action_type == "finalize":
        # finalize an iterative step
        action_controller = ActionController(action)

        if not action_controller.is_current_step_valid:
            raise SuspiciousOperation(_("There is not current valid step to process"))

        if action_controller.is_current_step_done:
            raise SuspiciousOperation(_("The current step is done"))

        action_controller.finalize_current_step()

    result['data'] = action.data
    result['completed'] = action.completed

    return HttpResponseRest(request, result)


@RestActionId.def_auth_request(Method.DELETE, Format.JSON, perms={
        'accession.delete_action': _("You are not allowed to delete an action")
    })
def action_delete(request, act_id):
    action = get_object_or_404(Action, pk=int(act_id))

    if ActionToEntity.objects.filter(action=action).exists():
        raise SuspiciousOperation(_("Cannot delete an action already referring to some entities"))

    action.delete()

    return HttpResponseRest(request, {})


@RestAction.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_action': _("You are not allowed to list actions")
})
def get_action_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    # @todo how to manage permission to list only auth actions

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Action)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    action_list = []

    for action in cq:
        a = {
            'id': action.id,
            'name': action.name,
            'action_type': action.action_type_id,
            'data': action.data,
            'user': action.user.username,
            'completed': action.completed,
            'created_date': action.created_date.strftime("%Y-%m-%d %H:%M:%S")
        }

        action_list.append(a)

    results = {
        'perms': [],
        'items': action_list,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestActionCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_action': _("You are not allowed to list the actions")
})
def get_batch_id_action_list_count(request):
    from main.cursor import CursorQuery
    cq = CursorQuery(Action)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestActionId.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action")
})
def get_action_details(request, act_id):
    action = get_object_or_404(Action, pk=int(act_id))

    result = {
        'id': action.id,
        'name': action.name,
        'description': action.description,
        'user': action.user.username,
        'data': action.data,
        'action_type': action.action_type_id,
        'completed': action.completed,
        'created_date': action.created_date.strftime("%Y-%m-%d %H:%M:%S")
    }

    return HttpResponseRest(request, result)


@RestActionIdUpload.def_auth_request(Method.POST, Format.JSON, perms={
    'accession.change_action': _("You are not allowed to modify an action")
})
def upload_action_id_content(request, act_id):
    action = get_object_or_404(Action, pk=int(act_id))

    if not request.FILES:
        raise SuspiciousOperation(_("No file specified"))

    up = request.FILES['file']
    target = request.POST.get('target')

    # check file size
    if up.size > localsettings.max_file_size:
        SuspiciousOperation(_("Upload file size limit is set to %i bytes") % localsettings.max_file_size)

    # simple check mime-types using the file extension
    mime_type = mimetypes.guess_type(up.name)[0]
    if mime_type is None:
        SuspiciousOperation(_("Undetermined uploaded file type"))

    if mime_type not in ALLOWED_MIMES:
        raise SuspiciousOperation(_("Unsupported file format"))

    # test mime-type with a buffer of a least 1024 bytes
    test_mime_buffer = io.BytesIO()
    data = io.BytesIO()

    # copy file content
    for chunk in up.chunks():
        data.write(chunk)

        if test_mime_buffer.tell() < 1024:
            test_mime_buffer.write(chunk)

    data.seek(0, io.SEEK_SET)

    # decode according mime type CSV or XLSX
    parser = ActionDataParser()

    # read row of input
    if mime_type in ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',):
        parser.parse_xlsx(data)
    else:
        parser.parse_csv(data)

    action_controller = ActionController(action)

    if not action_controller.is_current_step_valid:
        raise SuspiciousOperation(_("There is not current valid step to setup"))

    if action_controller.is_current_step_done:
        raise SuspiciousOperation(_("The current step is done"))

    action_controller.setup_data(parser.data, parser.columns)

    result = {
        'id': action.id,
        'data': action.data
    }

    return HttpResponseRest(request, result)


@RestActionIdDownload.def_auth_request(Method.GET, Format.ANY, parameters=('step_index', 'format'), perms={
    'accession.get_action': _("You are not allowed to get an action")
})
def download_action_id_content(request, act_id):
    action = get_object_or_404(Action, pk=int(act_id))
    step_index = int_arg(request.GET['step_index'])
    file_format = request.GET['format']

    # decode according mime type CSV or XLSX
    action_controller = ActionController(action)

    exporter = ActionDataExporter(action_controller, step_index)

    if not action_controller.is_current_step_valid:
        raise SuspiciousOperation(_("The step index is not valid"))

    if not action_controller.has_step_data(step_index):
        raise SuspiciousOperation(_("The step index has no data"))

    if file_format == 'csv':
        mime_type = 'text/csv'
        file_ext = ".csv"
        data = exporter.export_data_as_csv()
    elif file_format == 'xlsx':
        mime_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        file_ext = ".xlsx"
        data = exporter.export_data_as_xslx()
    else:
        raise SuspiciousOperation("Invalid format")

    file_name = "Action%sDataStep%i" % (act_id, step_index+1,) + file_ext

    response = StreamingHttpResponse(data, content_type=mime_type)
    response['Content-Disposition'] = 'attachment; filename="' + file_name + '"'
    response['Content-Length'] = exporter.size

    return response


@RestActionEntityId.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_action': _("You are not allowed to list actions")
})
def get_action_list_for_entity_id(request, ent_id, content_type_name):
    """
    Get the list of action for a specific entity and content type
    """
    # @todo how to manage permission to list only auth actions
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(ActionToEntity)

    # first filter on content type and entity id
    cq.filter(entity_type=content_type.id)
    cq.filter(entity_id=int_arg(ent_id))

    cq.inner_join(Action, related_name='id', to_related_name='action_id', entity=int(ent_id))

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    action_list = []

    for action in cq:
        a = {
            'id': action.id,
            'entity': action.entity_id,
            'entity_type': action.entity_type_id,
            'type': action.type_id,
            'data': action.data,
            'completed': action.completed,
            'created_date': action.created_date.strftime("%Y-%m-%d %H:%M:%S")
        }

        action_list.append(a)

    results = {
        'perms': [],
        'items': action_list,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestActionEntityIdCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_action': _("You are not allowed to list the actions")
})
def get_action_list_for_entity_id_count(request, ent_id, content_type_name):
    """
    Count the list of action for a specific entity and content type
    """
    # @todo how to manage permission to count only auth actions
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    from main.cursor import CursorQuery
    cq = CursorQuery(ActionToEntity)

    # first filter on content type and entity id
    cq.filter(entity_type=content_type.id)
    cq.filter(entity_id=int_arg(ent_id))

    cq.inner_join(Action, related_name='id', to_related_name='action_id', entity=int(ent_id))

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestActionIdData.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action")
})
def get_action_id_data_for_step(request, act_id, step_idx, type_num):
    action = get_object_or_404(Action, pk=int(act_id))

    # any elements of the array are returnedZ
    action_data = get_object_or_404(ActionData, action=action, step_index=step_idx, type=ActionDataType(type_num).value)

    results = {
        'action': action.id,
        'step': action_data.step_index,
        'data': action_data.data,
        'type': action_data.data_type
    }

    return HttpResponseRest(request, results)
