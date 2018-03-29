# -*- coding: utf-8; -*-
#
# @file entity.py
# @brief Rest handlers.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.views.decorators.cache import cache_page

from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.models import EntitySynonymType, InterfaceLanguages
from .main import RestMain


class RestMainEntity(RestMain):
    regex = r'^entity/$'
    suffix = 'entity'


class RestMainEntitySearch(RestMainEntity):
    regex = r'^search/$'
    suffix = 'search'


class RestMainEntityValues(RestMainEntity):
    regex = r'^(?P<content_type_name>[a-zA-Z\.-]+)/values/$'
    suffix = 'values'


class RestMainEntityDetails(RestMainEntity):
    regex = r'^(?P<content_type_name>[a-zA-Z\.-]+)/details/$'
    suffix = 'details'


class RestMainEntitySynonymType(RestMain):
    regex = r'^entity-synonym-type/$'
    suffix = 'entity-synonym-type'


class RestMainEntitySynonymTypeId(RestMainEntitySynonymType):
    regex = r'^(?P<est_id>[0-9]+)/$'
    suffix = 'id'


class RestMainEntitySynonymTypeIdLabel(RestMainEntitySynonymTypeId):
    regex = r'^label/$'
    suffix = 'label'


class RestMainEntitySynonymTypeValues(RestMainEntitySynonymType):
    regex = r'^(?P<content_type_name>[a-zA-Z\.-]+)/values/$'
    suffix = 'values'


@RestMainEntity.def_auth_request(Method.GET, Format.JSON, parameters=('app_label', 'model', 'object_id'))
def get_entity(request):
    """
    Retrieve an entity (generic details) from an app_label, model and object identifier.
    In others words from its content type and its uniquer identifier.

    @note Returned name if the natural name (it can be a name field or a code, the display label...).
    """
    app_label = request.GET['app_label']
    model = request.GET['model']
    object_id = int(request.GET['object_id'])

    if app_label and model and object_id:
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        entity = content_type.get_object_for_this_type(id=object_id)

    results = {
        'id': entity.id,
        'uuid': str(entity.uuid),
        'name': entity.natural_name(),
        'content_type': "%s.%s" % (app_label, model),
        'created_date': entity.created_date,
        'modified_date': entity.modified_date,
        'entity_status': entity.entity_status
    }

    return HttpResponseRest(request, results)


@RestMainEntitySearch.def_auth_request(Method.GET, Format.JSON, parameters=('filters',))
def search_entity(request):
    """
    Search for entities according to a specific app_label, model and partial entity name,
    or by its UUID (not implemented).
    """
    filters = json.loads(request.GET['filters'])
    # page = int_arg(request.GET.get('page', 1))

    app_label = filters.get('app_label')
    model = filters.get('model')
    object_name = filters.get('object_name')
    uuid = filters.get('uuid')

    entities = None

    if uuid:
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        entities = content_type.get_all_objects_for_this_type(Q(uuid__startswith=uuid))
    if app_label and model and object_name:
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        q = content_type.model_class().make_search_by_name(object_name)
        entities = content_type.model_class().objects.filter(q)

    entities_list = []

    for entity in entities:
        entities_list.append({
            'id': entity.id,
            'content_type': entity.content_type,
            'name': entity.natural_name(),
            'uuid': entity.uuid
        })

    results = {
        'perms': [],
        'items': entities_list
    }

    return HttpResponseRest(request, results)


@RestMainEntityValues.def_auth_request(Method.GET, Format.JSON, parameters=('values',))
def get_entity_values_for_content_type_name(request, content_type_name):
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    # json array
    values = json.loads(request.GET['values'])

    entities = content_type.get_all_objects_for_this_type(id__in=values)

    items = {}

    for entity in entities:
        items[entity.id] = entity.natural_name()

    results = {
        'cacheable': True,
        'validity': None,
        'items': items
    }

    return HttpResponseRest(request, results)


@RestMainEntityDetails.def_auth_request(Method.GET, Format.JSON, parameters=('values',))
def get_entity_details_for_content_type_name(request, content_type_name):
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    # json array
    values = json.loads(request.GET['values'])

    entities = content_type.get_all_objects_for_this_type(id__in=values)

    items = {}

    for entity in entities:
        items[entity.id] = entity.details()

    results = {
        'cacheable': True,
        'validity': None,
        'items': items
    }

    return HttpResponseRest(request, results)


@cache_page(60*60*24)
@RestMainEntitySynonymType.def_request(Method.GET, Format.JSON)
def list_entity_synonym_type(request):
    """
    Get the list of type of synonym in JSON
    """
    synonym_types = []

    for st in EntitySynonymType.objects.select_related('target_model').order_by('target_model__model', 'name'):
        synonym_types.append({
            'id': st.pk,
            'value': st.pk,  # st.name
            'name': st.name,
            'label': st.get_label(),
            'unique': st.unique,
            'multiple_entry': st.multiple_entry,
            'has_language': st.has_language,
            'target_model': ".".join(st.target_model.natural_key()),
            'can_delete': st.can_delete,
            'can_modify': st.can_modify
        })

    return HttpResponseRest(request, synonym_types)


@cache_page(60*60*24)
@RestMainEntitySynonymTypeValues.def_request(Method.GET, Format.JSON)
def get_entity_synonym_type(request, content_type_name):
    """
    Get the list of type of synonym for a specific entity in JSON.
    """
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    synonym_types = []

    for st in EntitySynonymType.objects.filter(target_model=content_type).order_by('name'):
        synonym_types.append({
            'id': st.pk,
            'value': st.pk,  # st.name
            'name': st.name,
            'label': st.get_label(),
            'unique': st.unique,
            'multiple_entry': st.multiple_entry,
            'has_language': st.has_language,
            'target_model': ".".join(st.target_model.natural_key()),
            'can_delete': st.can_delete,
            'can_modify': st.can_modify
        })

    return HttpResponseRest(request, synonym_types)


@RestMainEntitySynonymType.def_admin_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": EntitySynonymType.NAME_VALIDATOR,
            "label": EntitySynonymType.LABEL_VALIDATOR,
            "target_model": EntitySynonymType.TARGET_MODEL_VALIDATOR
        },
    },
    perms={
        'main.add_entitysynonymtype': _("You are not allowed to create a synonym type of entity"),
    },
    staff=True)
def post_entity_synonym_type(request):
    """
    Create an new entity synonym type.
    """
    name = request.data['name']
    label = request.data['label']
    target_model_name = request.data['target_model']

    app_label, model = target_model_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    lang = translation.get_language()

    entity_synonym_type = EntitySynonymType()
    entity_synonym_type.name = name
    entity_synonym_type.set_label(lang, label)
    entity_synonym_type.target_model = content_type
    entity_synonym_type.save()

    results = {
        'id': entity_synonym_type.pk,
        'value': entity_synonym_type.pk,  # st.name
        'name': entity_synonym_type.name,
        'label': entity_synonym_type.get_label(),
        'unique': entity_synonym_type.unique,
        'multiple_entry': entity_synonym_type.multiple_entry,
        'has_language': entity_synonym_type.has_language,
        'target_model': ".".join(entity_synonym_type.target_model.natural_key()),
        'can_delete': entity_synonym_type.can_delete,
        'can_modify': entity_synonym_type.can_modify
    }

    return HttpResponseRest(request, results)


@RestMainEntitySynonymTypeId.def_admin_request(Method.DELETE, Format.JSON,
    perms={
        'main.remove_entitysynonymtype': _("You are not allowed to remove a synonym type of entity"),
    },
    staff=True
)
def delete_entity_synonym_type(request, est_id):
    entity_synonym_type = get_object_or_404(EntitySynonymType, id=int(est_id))

    # do we allow delete because of data consistency ?
    # it is not really a problem because the code is a standard
    entity_synonym_type.delete()

    return HttpResponseRest(request, {})


@RestMainEntitySynonymTypeIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_entity_synonym_type(request, est_id):
    """
    Returns labels for each language related to the user interface.
    """
    entity_synonym_type = get_object_or_404(EntitySynonymType, id=int(est_id))

    label_dict = entity_synonym_type.label

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestMainEntitySynonymTypeIdLabel.def_admin_request(Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": EntitySynonymType.LABEL_VALIDATOR
    },
    perms={
        'main.change_entitysynonymtype': _("You are not allowed to modify a synonym type of entity"),
    },
    staff=True)
def change_language_labels(request, est_id):
    entity_synonym_type = get_object_or_404(EntitySynonymType, id=int(est_id))

    labels = request.data
    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

        entity_synonym_type.label = labels
    entity_synonym_type.save()

    result = {
        'label': entity_synonym_type.get_label()
    }

    return HttpResponseRest(request, result)


@RestMainEntitySynonymTypeId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": EntitySynonymType.NAME_VALIDATOR_OPTIONAL,
            "unique": {"type": "boolean", "required": False},
            "multiple_entry": {"type": "boolean", "required": False},
            "has_language": {"type": "boolean", "required": False},
        },
    },
    perms={
        'main.change_entitysynonymtype': _("You are not allowed to modify a synonym type of entity"),
    },
    staff=True
)
def patch_entity_synonym_type(request, est_id):
    update = False

    entity_synonym_type = get_object_or_404(EntitySynonymType, id=int(est_id))
    name = request.data.get('name')

    if not entity_synonym_type.can_modify:
        raise SuspiciousOperation(_("It is not permit to modify this synonym type of entity"))

    result = {
        'id': entity_synonym_type.id,
        'name': entity_synonym_type.name
    }

    # @todo check if some date to avoid changing unique/multiple_entry/has_language

    if name and name != entity_synonym_type.name:
        if EntitySynonymType.objects.filter(name__exact=name).exists():
            raise SuspiciousOperation(_("Name of synonym type of entity already in usage"))

        entity_synonym_type.name = name
        entity_synonym_type.full_clean()

        result['name'] = name
        update = True

    if 'unique' in request.data:
        entity_synonym_type.unique = request.data['unique']

        result['unique'] = entity_synonym_type.unique
        update = True

    if 'multiple_entry' in request.data:
        entity_synonym_type.multiple_entry = request.data['multiple_entry']

        result['multiple_entry'] = entity_synonym_type.multiple_entry
        update = True

    if 'has_language' in request.data:
        entity_synonym_type.has_language = request.data['has_language']

        result['has_language'] = entity_synonym_type.has_language
        update = True

    if update:
        entity_synonym_type.save()

    return HttpResponseRest(request, result)
