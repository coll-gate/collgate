# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate descriptor module, descriptor model
"""
import json

from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _
from django.db.models.functions import Length

from descriptor.describable import descriptor_value_validate
from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from main.models import InterfaceLanguages
from .descriptor import RestDescriptor
from .models import DescriptorModel, DescriptorModelType, DescriptorType, DescriptorModelTypeCondition, \
    DescriptorCondition


class RestDescriptorModel(RestDescriptor):
    regex = r'^model/$'
    name = 'descriptor-model'


class RestDescriptorModelSearch(RestDescriptorModel):
    regex = r'^search/$'
    suffix = 'search'


class RestDescriptorModelId(RestDescriptorModel):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorModelIdTypeOrder(RestDescriptorModelId):
    regex = r'order/$'
    suffix = 'order'


class RestDescriptorModelIdType(RestDescriptorModelId):
    regex = r'^type/$'
    suffix = 'type'


class RestDescriptorModelIdTypeId(RestDescriptorModelIdType):
    regex = r'^(?P<tid>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorModelIdTypeIdLabel(RestDescriptorModelIdTypeId):
    regex = r'^label/$'
    suffix = 'label'


class RestDescriptorModelIdTypeIdCondition(RestDescriptorModelIdTypeId):
    regex = r'^condition/$'
    suffix = 'condition'


@RestDescriptorModel.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_models(request):
    """
    Returns a list of models of descriptor ordered by name.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.split('/')
        qs = DescriptorModel.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = DescriptorModel.objects.all()

    dms = qs.order_by('name')[:limit]

    dm_list = []

    for dm in dms:
        dm_list.append({
            'id': dm.id,
            'name': dm.name,
            'verbose_name': dm.verbose_name,
            'description': dm.description,
            'num_descriptor_model_types': dm.descriptor_model_types.all().count()
        })

    if len(dm_list) > 0:
        # prev cursor (asc order)
        dm = dm_list[0]
        prev_cursor = "%s/%s" % (dm['name'], dm['id'])

        # next cursor (asc order)
        dm = dm_list[-1]
        next_cursor = "%s/%s" % (dm['name'], dm['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': dm_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestDescriptorModelId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_model(request, id):
    dm_id = int(id)
    dm = get_object_or_404(DescriptorModel, id=dm_id)

    result = {
        'id': dm.id,
        'name': dm.name,
        'verbose_name': dm.verbose_name,
        'description': dm.description,
        'num_descriptor_model_types': dm.descriptor_model_types.all().count()
    }

    return HttpResponseRest(request, result)


@RestDescriptorModel.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "verbose_name": {"type": "string", 'maxLength': 255, "required": False, "blank": True},
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True},
        },
    },
    perms={'descriptor.add_descriptormodel': _('You are not allowed to create a model of descriptor')},
    staff=True)
def create_descriptor_model(request):
    # check name uniqueness
    if DescriptorModel.objects.filter(name=request.data['name']).exists():
        raise SuspiciousOperation(_('A model of descriptor with a similar name already exists'))

    # create descriptor model
    dm = DescriptorModel(name=request.data['name'])

    verbose_name = request.data.get('verbose_name')
    if verbose_name:
        dm.verbose_name = request.data.get('verbose_name', '')
    else:
        dm.verbose_name = request.data['name'].capitalize()

    dm.description = request.data.get('description', None)
    dm.save()

    result = {
        'id': dm.id,
        'name': dm.name,
        'verbose_name': dm.verbose_name,
        'description': dm.description,
        'num_descriptor_model_types': 0
    }

    return HttpResponseRest(request, result)


@RestDescriptorModelId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "verbose_name": {"type": "string", 'maxLength': 255, "required": False, "blank": True},
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True},
        },
    },
    perms={'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor')},
    staff=True)
def update_descriptor_model(request, id):
    dm_id = int(id)

    model = get_object_or_404(DescriptorModel, id=dm_id)

    name = request.data['name']
    verbose_name = request.data.get('verbose_name', '')
    description = request.data.get('description', '')

    model.name = name
    model.verbose_name = verbose_name
    model.description = description

    model.full_clean()
    model.save()

    return HttpResponseRest(request, {})


@RestDescriptorModelId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'descriptor.delete_descriptormodel': _('You are not allowed to remove a model of descriptor')
    },
    staff=True)
def remove_descriptor_model(request, id):
    dm_id = int(id)

    model = get_object_or_404(DescriptorModel, id=dm_id)

    if model.descriptor_model_types.all().exists():
        raise SuspiciousOperation(_("Only empty models of descriptor can be removed"))

    if model.panels.all().exists():
        raise SuspiciousOperation(_("Only unused models of descriptor can be removed"))

    model.delete()
    return HttpResponseRest(request, {})


@RestDescriptorModelSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), staff=True)
def search_descriptor_models(request):
    """
    Filters the models of descriptors by name.
    @todo could needs pagination
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    models = None

    if filters['method'] == 'ieq' and 'name' in filters['fields']:
        models = DescriptorModel.objects.filter(name__iexact=filters['name'])
    elif filters['method'] == 'icontains' and 'name' in filters['fields']:
        models = DescriptorModel.objects.filter(name__icontains=filters['name'])

    models_list = []

    if models:
        for model in models:
            models_list.append({
                "id": model.id,
                "name": model.name,
            })

    response = {
        'items': models_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestDescriptorModelIdType.def_auth_request(Method.GET, Format.JSON, staff=True)
def list_descriptor_model_types_for_model(request, id):
    """
    Returns a list of type of descriptors ordered by name for a given model of descriptor.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    dm_id = int(id)
    dm = get_object_or_404(DescriptorModel, id=dm_id)

    if cursor:
        cursor_position, cursor_id = cursor.split('/')
        qs = dm.descriptor_model_types.filter(Q(position__gt=cursor_position))
    else:
        qs = dm.descriptor_model_types.all()

    dmts = qs.order_by('position')[:limit]

    items_list = []

    for dmt in dmts:
        items_list.append({
            'id': dmt.id,
            'name': dmt.name,
            'position': dmt.position,
            'label': dmt.get_label(),
            'descriptor_type_group': dmt.descriptor_type.group.id,
            'descriptor_type': dmt.descriptor_type.id,
            'descriptor_type_name': dmt.descriptor_type.name,
            'descriptor_type_code': dmt.descriptor_type.code,
            'mandatory': dmt.mandatory,
            'set_once': dmt.set_once
        })

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = "%i/%s" % (obj['position'], obj['id'])

        # next cursor (asc order)
        dm = items_list[-1]
        next_cursor = "%i/%s" % (obj['position'], obj['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': items_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestDescriptorModelIdType.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "label": {"type": "string", 'maxLength': 64},
            "mandatory": {"type": "boolean"},
            "set_once": {"type": "boolean"},
            "position": {"type": "number"},
            "descriptor_type_code": {"type": "string", 'minLength': 3, 'maxLength': 64},
        },
    },
    perms={
        'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
        'descriptor.add_descriptormodeltype': _('You are not allowed to create a type of model of descriptor'),
    },
    staff=True)
def create_descriptor_type_for_model(request, id):
    dm_id = int(id)

    dt_code = request.data['descriptor_type_code']

    lang = translation.get_language()

    mandatory = bool(request.data['mandatory'])
    set_once = bool(request.data['set_once'])
    position = int(request.data['position'])

    dm = get_object_or_404(DescriptorModel, id=dm_id)
    dt = get_object_or_404(DescriptorType, code=dt_code)

    dmt = dm.descriptor_model_types.all().order_by(Length('name').desc(), '-name')[:1]
    if dmt.exists():
        name = "%i_%i" % (dm_id, int(dmt[0].name.split('_')[1])+1)
    else:
        name = "%i_%i" % (dm_id, 1)

    dmt = DescriptorModelType()

    dmt.name = name
    dmt.descriptor_model = dm
    dmt.set_label(lang, request.data['label'])
    dmt.mandatory = mandatory
    dmt.set_once = set_once
    dmt.position = position
    dmt.descriptor_type = dt

    dmt.full_clean()
    dmt.save()

    # rshift of 1 others descriptor_model_types
    for ldmt in dm.descriptor_model_types.filter(position__gte=position).order_by('position'):
        if ldmt.id != dmt.id:
            new_position = ldmt.position + 1
            ldmt.position = new_position
            ldmt.save()

    result = {
        'id': dmt.id,
        'name': dmt.name,
        'label': dmt.get_label(),
        'mandatory': dmt.mandatory,
        'set_once': dmt.set_once,
        'position': dmt.position,
        'descriptor_type_group': dt.group.id,
        'descriptor_type': dt.id,
        'descriptor_type_name': dt.name,
        'descriptor_type_code': dt.code
    }

    return HttpResponseRest(request, result)


@RestDescriptorModelIdTypeOrder.def_auth_request(Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "descriptor_model_type_id": {"type": "number"},
            "position": {"type": "number"},
        },
    },
    perms={
        'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
        'descriptor.change_descriptormodeltype': _('You are not allowed to modify a type of model of descriptor'),
    },
    staff=True)
def reorder_descriptor_types_for_model(request, id):
    """
    Reorder the types of models of descriptors according to the new position of one of the elements.
    """
    dm_id = int(id)

    dmt_id = int(request.data['descriptor_model_type_id'])
    position = int(request.data['position'])

    dm = get_object_or_404(DescriptorModel, id=dm_id)
    dmt_ref = get_object_or_404(DescriptorModelType, id=dmt_id, descriptor_model__id=dm_id)

    dmt_list = []

    if position < dmt_ref.position:
        for dmt in dm.descriptor_model_types.filter(position__gte=position).order_by('position'):
            if dmt.id != dmt_id:
                dmt_list.append(dmt)

        dmt_ref.position = position
        dmt_ref.save()

        next_position = position + 1

        for dmt in dmt_list:
            dmt.position = next_position
            dmt.save()

            next_position += 1
    else:
        for dmt in dm.descriptor_model_types.filter(position__lte=position).order_by('position'):
            if dmt.id != dmt_id:
                dmt_list.append(dmt)

        dmt_ref.position = position
        dmt_ref.save()

        next_position = 0

        for dmt in dmt_list:
            dmt.position = next_position
            dmt.save()

            next_position += 1

    return HttpResponseRest(request, {})


@RestDescriptorModelIdTypeId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "mandatory": {"type": "boolean", "required": False},
            "set_once": {"type": "boolean", "required": False},
            "label": {"type": "string", 'maxLength': 64, "required": False},
        },
    },
    perms={
         'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
         'descriptor.change_descriptormodeltype': _('You are not allowed to modify a type of model of descriptor'),
    },
    staff=True)
def patch_descriptor_model_type_for_model(request, id, tid):
    """
    Change the 'label', 'mandatory' or 'set_once' of a type of model of descriptor.
    To changes the position uses the order method of the collection.
    """
    dm_id = int(id)
    dmt_id = int(tid)

    mandatory = request.data.get('mandatory')
    set_once = request.data.get('set_once')
    label = request.data.get('label')

    dmt = get_object_or_404(DescriptorModelType, id=dmt_id, descriptor_model__id=dm_id)

    # cannot change the mandatory field once there is some data
    if dmt.descriptor_model.in_usage() and (mandatory is not None):
        raise SuspiciousOperation(_("There is some data using the model of descriptor"))

    if label is not None:
        lang = translation.get_language()
        dmt.set_label(lang, label)

    if mandatory is not None:
        # mandatory is incompatible with a condition
        if dmt.conditions.exists():
            raise SuspiciousOperation(_("A required type of model of descriptor cannot have a condition. " +
                                        "You must delete the condition before to set the required state"))

        dmt.mandatory = bool(mandatory)
    if set_once is not None:
        dmt.set_once = bool(set_once)

    dmt.save()

    return HttpResponseRest(request, {})


@RestDescriptorModelIdTypeId.def_auth_request(Method.DELETE, Format.JSON,
    perms={
         'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
         'descriptor.delete_descriptormodeltype': _('You are not allowed to remove a type of model of descriptor'),
    },
    staff=True)
def delete_descriptor_model_type_for_model(request, id, tid):
    """
    If possible delete a descriptor model type from de descriptor model.
    It is not possible if there is data using the model of descriptor or the status is valid.
    """
    dm_id = int(id)
    dmt_id = int(tid)

    dm = get_object_or_404(DescriptorModel, id=dm_id)

    if dm.in_usage():
        raise SuspiciousOperation(_("There is some data using the model of descriptor"))

    dmt = get_object_or_404(DescriptorModelType, id=dmt_id, descriptor_model__id=dm_id)

    position = dmt.position
    dmt.delete()

    # reorder following dmts
    for dmt in dm.descriptor_model_types.filter(position__gt=position).order_by('position'):
        new_position = dmt.position - 1
        dmt.position = new_position
        dmt.save()

    return HttpResponseRest(request, {})


@RestDescriptorModelIdTypeIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_descriptor_model_type(request, id, tid):
    """
    Returns labels for each language related to the user interface.
    """
    dm_id = int(id)
    dmt_id = int(tid)

    dmt = get_object_or_404(DescriptorModelType, id=dmt_id, descriptor_model__id=dm_id)

    label_dict = json.loads(dmt.label)

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestDescriptorModelIdTypeIdLabel.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": {
            "type": "string",
            "maxLength": 64
        }
    },
    perms={
        'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
        'descriptor.change_descriptormodeltype': _('You are not allowed to modify a type of model of descriptor'),
    },
    staff=True)
def change_all_labels_of_descriptor_model_type(request, id, tid):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    dm_id = int(id)
    dmt_id = int(tid)

    dmt = get_object_or_404(DescriptorModelType, id=dmt_id, descriptor_model__id=dm_id)

    labels = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    dmt.label = json.dumps(labels)

    dmt.update_field('label')
    dmt.save()

    result = {
        'label': dmt.get_label()
    }

    return HttpResponseRest(request, result)


@RestDescriptorModelIdTypeIdCondition.def_auth_request(Method.GET, Format.JSON)
def get_condition_for_descriptor_model_type(request, id, tid):
    """
    Get if it exists, the condition related to the display of a descriptor model type.
    """
    dm_id = int(id)
    dmt_id = int(tid)

    conditions = DescriptorModelTypeCondition.objects.filter(descriptor_model_type_id=dmt_id)
    condition = None

    if conditions.exists():
        dmtc = conditions[0]

        result = {
            'defined': True,
            'condition': dmtc.condition,
            'target': dmtc.target.id,
            'values': json.loads(dmtc.values)
        }
    else:
        result = {
            'defined': False,
            'condition': 0,
            'target': 0,
            'values': None
        }

    return HttpResponseRest(request, result)


@RestDescriptorModelIdTypeIdCondition.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "target": {"type": "integer"},
            "condition": {"type": "integer", "minValue": 0, "maxValue": 3},
            "values": {
                "type": "array",
                "minItems": 0,
                "maxItems": 64,
                "items": {
                    "type": ["boolean", "string", "number", "null"]
                },
                "required": False
            },
        }
    },
    perms={
        'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
        'descriptor.change_descriptormodeltype': _('You are not allowed to modify a type of model of descriptor'),
    },
    staff=True)
def create_condition_for_descriptor_model_type(request, id, tid):
    """
    Create the unique condition (for now) of the descriptor model type.
    """
    dm_id = int(id)
    dmt_id = int(tid)
    target_id = int(request.data['target'])

    dmt = get_object_or_404(DescriptorModelType, id=dmt_id, descriptor_model__id=dm_id)
    target = get_object_or_404(DescriptorModelType, id=target_id, descriptor_model__id=dm_id)

    if dmt.mandatory:
        raise SuspiciousOperation(_("It is not possible to define a condition on a required type of model of descriptor"))

    # check if there is a cyclic condition
    if target.conditions.filter(target=dmt).exists():
        raise SuspiciousOperation(_("Cyclic condition detected. You cannot define this condition or you must remove the condition on the target"))

    condition = DescriptorCondition(request.data['condition'])
    values = request.data['values']

    # validate the values[0]
    format = json.loads(target.descriptor_type.format)

    for value in values:
        descriptor_value_validate(format, value, target)

    dmtc = DescriptorModelTypeCondition()

    dmtc.name = "%s_%03i" % (dmt.id, 1)
    dmtc.descriptor_model_type = dmt
    dmtc.condition = condition.value
    dmtc.target = target
    dmtc.values = json.dumps(values)

    dmtc.save()

    result = {
        'defined': True,
        'condition': dmtc.condition,
        'target': dmtc.target.id,
        'values': values
    }

    return HttpResponseRest(request, result)


@RestDescriptorModelIdTypeIdCondition.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "target": {"type": "integer"},
            "condition": {"type": "integer", "minValue": 0, "maxValue": 3},
            "values": {
                "type": "array",
                "minItems": 0,
                "maxItems": 64,
                "items": {
                    "type": ["boolean", "string", "number", "null"]
                },
                "required": False
            },
        }
    },
    perms={
        'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
        'descriptor.change_descriptormodeltype': _('You are not allowed to modify a type of model of descriptor'),
        'descriptor.change_descriptormodeltypecondition': _('You are not allowed to modify a condition of a model of descriptor'),
    },
    staff=True)
def modify_condition_for_descriptor_model_type(request, id, tid):
    """
    Update the unique condition (for now) of the descriptor model type.
    """
    dm_id = int(id)
    dmt_id = int(tid)
    target_id = int(request.data['target'])

    target = get_object_or_404(DescriptorModelType, id=target_id, descriptor_model__id=dm_id)

    conditions = DescriptorModelTypeCondition.objects.filter(descriptor_model_type_id=dmt_id)
    dmtc = None

    if conditions.exists():
        dmtc = conditions[0]
        values = request.data['values']

        # validate the values
        format = json.loads(target.descriptor_type.format)

        for value in values:
            descriptor_value_validate(format, value, target)

        condition = DescriptorCondition(request.data['condition'])

        dmtc.condition = condition.value
        dmtc.target = target
        dmtc.values = json.dumps(values)

        dmtc.save()
    else:
        raise DescriptorModelTypeCondition.DoesNotExist()

    result = {
        'defined': True,
        'condition': dmtc.condition,
        'target': dmtc.target.id,
        'values': values
    }

    return HttpResponseRest(request, result)


@RestDescriptorModelIdTypeIdCondition.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
        'descriptor.change_descriptormodeltype': _('You are not allowed to modify a type of model of descriptor'),
        'descriptor.delete_descriptormodeltypecondition': _('You are not allowed to delete a condition of a model of descriptor'),
    },
    staff=True)
def delete_condition_for_descriptor_model_type(request, id, tid):
    """
    Delete the unique condition (for now) of the descriptor model type.
    """
    dm_id = int(id)
    dmt_id = int(tid)

    conditions = DescriptorModelTypeCondition.objects.filter(descriptor_model_type_id=dmt_id)

    if conditions.exists():
        conditions[0].delete()

    return HttpResponseRest(request, {})
