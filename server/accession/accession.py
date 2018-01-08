# -*- coding: utf-8; -*-
#
# @file accession.py
# @brief coll-gate accession rest handler
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Prefetch
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession import localsettings
from descriptor.describable import DescriptorsBuilder
# from descriptor.models import Layout, DescriptorModelType
from descriptor.models import Layout
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.models import Language
from permission.utils import get_permissions_for
from classification.models import ClassificationEntry

from .models import Accession, AccessionSynonym, AccessionClassificationEntry, AccessionPanel, AccessionView
from .base import RestAccession


class RestAccessionAccession(RestAccession):
    regex = r'^accession/$'
    name = 'accession'


class RestAccessionSearch(RestAccessionAccession):
    regex = r'^search/$'
    suffix = 'search'


class RestAccessionAccessionCount(RestAccessionAccession):
    regex = r'^count/$'
    name = 'count'


class RestAccessionId(RestAccessionAccession):
    regex = r'^(?P<acc_id>[0-9]+)/$'
    suffix = 'id'


# @RestAccessionAccession.def_auth_request(Method.POST, Format.JSON, content={
#     "type": "object",
#     "properties": {
#         "name": AccessionSynonym.NAME_VALIDATOR,
#         "code": AccessionSynonym.CODE_VALIDATOR,
#         "layout": {"type": "number"},
#         "primary_classification_entry": {"type": "number"},
#         "descriptors": {"type": "object"},
#         "language": AccessionSynonym.LANGUAGE_VALIDATOR
#     },
# }, perms={
#     'accession.add_accession': _("You are not allowed to create an accession")
# })
# def create_accession(request):
#     name = request.data['name']
#     code = request.data['code']
#     layout_id = int_arg(request.data['layout'])
#     primary_classification_entry_id = int_arg(request.data['primary_classification_entry'])
#     descriptors = request.data['descriptors']
#     language = request.data['language']
#
#     # check uniqueness of the code for any type of synonym
#     if AccessionSynonym.objects.filter(name=code).exists():
#         raise SuspiciousOperation(_("The code of the accession is already used as a synonym name"))
#
#     # check uniqueness of the code
#     if Accession.objects.filter(code=code).exists():
#         raise SuspiciousOperation(_("The code of the accession is already used"))
#
#     if not Language.objects.filter(code=language).exists():
#         raise SuspiciousOperation(_("The language is not supported"))
#
#     if name == code:
#         raise SuspiciousOperation(_("The code and the name of the accession must be different"))
#
#     content_type = get_object_or_404(ContentType, app_label="accession", model="accession")
#     layout = get_object_or_404(Layout, id=layout_id, target=content_type)
#
#     try:
#         with transaction.atomic():
#             # common properties
#             accession = Accession()
#             accession.name = name
#             accession.code = code
#             accession.layout = layout
#
#             # primary classification entry
#             primary_classification_entry = get_object_or_404(ClassificationEntry, id=primary_classification_entry_id)
#             accession.primary_classification_entry = primary_classification_entry
#
#             # descriptors
#             descriptors_builder = DescriptorsBuilder(accession)
#
#             descriptors_builder.check_and_update(layout, descriptors)
#             accession.descriptors = descriptors_builder.descriptors
#
#             accession.save()
#
#             # update owner on external descriptors
#             descriptors_builder.update_associations()
#
#             # primary classifications in M2M
#             AccessionClassificationEntry.objects.create(
#                 accession=accession, classification_entry=primary_classification_entry, primary=True)
#
#             # initial synonym GRC code
#             grc_code = AccessionSynonym(
#                 entity=accession,
#                 name=code,
#                 synonym_type_id=localsettings.synonym_type_accession_code,
#                 language='en')
#             grc_code.save()
#
#             # primary synonym if defined
#             primary_name = AccessionSynonym(
#                 entity=accession,
#                 name=name,
#                 synonym_type_id=localsettings.synonym_type_accession_name,
#                 language=language)
#             primary_name.save()
#
#             accession.synonyms.add(grc_code)
#             accession.synonyms.add(primary_name)
#
#             # add related classification entries
#             classification_entry_bulk = []
#             for classification_entry in primary_classification_entry.related.all():
#                 ace = AccessionClassificationEntry(
#                     primary=False,
#                     accession=accession,
#                     classification_entry=classification_entry
#                 )
#
#                 classification_entry_bulk.append(ace)
#
#             AccessionClassificationEntry.objects.bulk_create(classification_entry_bulk)
#
#     except IntegrityError as e:
#         DescriptorModelType.integrity_except(Accession, e)
#
#     response = {
#         'id': accession.pk,
#         'name': accession.name,
#         'code': accession.code,
#         'layout': layout.id,
#         'primary_classification_entry': primary_classification_entry.id,
#         'descriptors': descriptors,
#         'synonyms': [
#             {
#                 'id': grc_code.id,
#                 'name': grc_code.name,
#                 'synonym_type': grc_code.synonym_type_id,
#                 'language': grc_code.language
#             },
#             {
#                 'id': primary_name.id,
#                 'name': primary_name.name,
#                 'synonym_type': primary_name.synonym_type_id,
#                 'language': primary_name.language
#             }
#         ]
#     }
#
#     return HttpResponseRest(request, response)


@RestAccessionAccessionCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_accession_list_count(request):
    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])

        for criteria in search:
            if 'field' in criteria and criteria.get('field') == 'panels':
                AccessionView._meta.model_name = "accession"
                cq = CursorQuery(AccessionView)
                break

        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestAccessionAccession.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_accession_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    # order_by = ['name', 'id']
    # order_by = ['primary_classification_entry->name', 'id']
    # order_by = ['#MCPD_ORIGCTY->name', 'name', 'id']
    # order_by = ['-#IPGRI_4.1.1->value1', 'name', 'id']
    # order_by = ['#test_accession->name', '#MCPD_ORIGCTY->name', '#IPGRI_4.1.1->value1', 'name', 'id']
    # order_by = ['#MCPD_ORIGCTY->name', '#IPGRI_4.1.1->value1', 'name', 'id']

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])

        for criteria in search:
            if 'field' in criteria and criteria.get('field') == 'panels':
                AccessionView._meta.model_name = "accession"
                cq = CursorQuery(AccessionView)
                break

        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    # cq.prefetch_related(Prefetch(
    #     "synonyms",
    #     queryset=AccessionSynonym.objects.all().order_by('synonym_type', 'language')))

    cq.select_related('primary_classification_entry->name', 'primary_classification_entry->rank')
    # cq.select_related('#test_accession->code')

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    accession_items = []

    for accession in cq:
        a = {
            'id': accession.pk,
            'name': accession.name,
            'code': accession.code,
            'primary_classification_entry': accession.primary_classification_entry_id,
            'layout': accession.layout_id,
            'descriptors': accession.descriptors,
            'synonyms': [],
            'primary_classification_entry_details': {
                'id': accession.primary_classification_entry.id,
                'name': accession.primary_classification_entry.name,
                'rank': accession.primary_classification_entry.rank_id,
            }
        }

        # for synonym in accession.synonyms.all():
        #     a['synonyms'].append({
        #         'id': synonym.id,
        #         'name': synonym.name,
        #         'synonym_type': synonym.synonym_type_id,
        #         'language': synonym.language
        #     })

        accession_items.append(a)

    results = {
        'perms': [],
        'items': accession_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestAccessionId.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get an accession")
})
def get_accession_details_json(request, acc_id):
    """
    Get the details of an accession.
    """

    accession = AccessionView.objects.get(id=int(acc_id))

    # check permission on this object
    perms = get_permissions_for(request.user, accession.content_type.app_label, accession.content_type.model,
                                accession.pk)
    if 'accession.get_accession' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this accession'))

    result = {
        'id': accession.id,
        'name': accession.name,
        'code': accession.code,
        'primary_classification_entry': accession.primary_classification_entry_id,
        'synonyms': [],
        'layout': accession.layout_id,
        'descriptors': accession.descriptors,
        'panels': []
    }

    for panel_id in accession.panels:
        panel = AccessionPanel.objects.get(id=panel_id)
        result['panels'].append({
            'id': panel.id,
            'name': panel.name,
            'layout': panel.layout.pk if panel.layout else None,
            'descriptors': panel.descriptors,
            'accessions_amount': panel.accessions.count()
        })

    for s in AccessionSynonym.objects.filter(entity=accession.id).order_by('synonym_type', 'language'):
        result['synonyms'].append({
            'id': s.id,
            'name': s.name,
            'synonym_type': s.synonym_type_id,
            'language': s.language,
        })

    return HttpResponseRest(request, result)


@RestAccessionSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), perms={
    'accession.search_accession': _("You are not allowed to search accessions")
})
def search_accession(request):
    """
    Quick search for an accession with a exact or partial name and layout of descriptor.
    It is possible to have multiple results for a same accession because of the multiples synonyms.

    The filters can be :
        - name: value to look for the name field.
        - method: for the name 'ieq' or 'icontains' for insensitive case equality or %like% respectively.
        - layout: id of the descriptor layout to look for.
        - fields: list of fields to look for.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        qs = Accession.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Accession.objects.all()

    name_method = filters.get('method', 'ieq')
    if 'layout' in filters['fields']:
        layout = int_arg(filters['layout'])

        if name_method == 'ieq':
            qs = qs.filter(Q(synonyms__name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = qs.filter(Q(synonyms__name__icontains=filters['name']))

        qs = qs.filter(Q(layout_id=layout))
    elif 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = qs.filter(synonyms__name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(synonyms__name__icontains=filters['name'])
    elif 'code' in filters['fields']:
        if name_method == 'ieq':
            qs = qs.filter(code__iexact=filters['code'])
        elif name_method == 'icontains':
            qs = qs.filter(code__icontains=filters['code'])

    qs = qs.prefetch_related(
        Prefetch(
            "synonyms",
            queryset=AccessionSynonym.objects.exclude(
                synonym_type=localsettings.synonym_type_accession_code).order_by('synonym_type', 'language'))
    )

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for accession in qs:
        label = accession.name

        for synonym in accession.synonyms.all():
            label += ', ' + synonym.name

        a = {
            'id': accession.id,
            'label': label,
            'value': accession.code
        }

        items_list.append(a)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = (obj['value'], obj['id'])
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


# @RestAccessionId.def_auth_request(Method.PATCH, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "primary_classification_entry": {"type": "integer", "required": False},
#             "entity_status": Accession.ENTITY_STATUS_VALIDATOR_OPTIONAL,
#             "descriptors": {"type": "object", "required": False},
#         },
#     },
#     perms={
#       'accession.change_accession': _("You are not allowed to modify an accession"),
#     })
# def patch_accession(request, acc_id):
#     accession = get_object_or_404(Accession, id=int(acc_id))
#
#     entity_status = request.data.get("entity_status")
#     descriptors = request.data.get("descriptors")
#
#     result = {
#         'id': accession.id
#     }
#
#     try:
#         with transaction.atomic():
#             if 'primary_classification_entry' in request.data:
#                 primary_classification_entry_id = int(request.data['primary_classification_entry'])
#                 primary_classification_entry = get_object_or_404(ClassificationEntry,
#                                                                  id=primary_classification_entry_id)
#
#                 # update FK
#                 accession.primary_classification_entry = primary_classification_entry
#                 result['primary_classification_entry'] = primary_classification_entry.id
#
#                 # and replace from classification entry M2M previous primary
#                 accession_classification_entry = get_object_or_404(
#                     AccessionClassificationEntry, accession=accession, primary=True)
#
#                 accession_classification_entry.classification_entry = primary_classification_entry
#                 accession_classification_entry.save()
#
#                 accession.update_field('primary_classification_entry')
#
#             if entity_status is not None and accession.entity_status != entity_status:
#                 accession.set_status(entity_status)
#                 result['entity_status'] = entity_status
#                 accession.update_field('entity_status')
#
#             if descriptors is not None:
#                 # update descriptors
#                 descriptors_builder = DescriptorsBuilder(accession)
#
#                 descriptors_builder.check_and_update(accession.layout, descriptors)
#
#                 accession.descriptors = descriptors_builder.descriptors
#                 result['descriptors'] = accession.descriptors
#
#                 descriptors_builder.update_associations()
#
#                 accession.update_descriptors(descriptors_builder.changed_descriptors())
#                 accession.update_field('descriptors')
#
#             accession.save()
#     except IntegrityError as e:
#         DescriptorModelType.integrity_except(Accession, e)
#
#     return HttpResponseRest(request, result)


@RestAccessionId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'accession.delete_accession': _("You are not allowed to delete an accession"),
})
def delete_accession(request, acc_id):
    accession = get_object_or_404(Accession, id=int(acc_id))

    accession.synonyms.clear()
    accession.delete()

    return HttpResponseRest(request, {})
