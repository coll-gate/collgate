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
from django.db.models import Prefetch, prefetch_related_objects
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from descriptor.describable import DescriptorsBuilder
from descriptor.models import DescriptorMetaModel, DescriptorModelType
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.models import Language
from permission.utils import get_permissions_for
from classification.models import Taxon

from .models import Accession, AccessionSynonym
from .base import RestAccession


class RestAccessionAccession(RestAccession):
    regex = r'^accession/$'
    name = 'accession'


class RestAccessionSearch(RestAccessionAccession):
    regex = r'^search/$'
    suffix = 'search'


class RestAccessionId(RestAccessionAccession):
    regex = r'^(?P<acc_id>[0-9]+)/$'
    suffix = 'id'


@RestAccessionAccession.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": AccessionSynonym.NAME_VALIDATOR,
            "code": AccessionSynonym.CODE_VALIDATOR,
            "descriptor_meta_model": {"type": "number"},
            "parent": {"type": "number"},
            "descriptors": {"type": "object"},
            "language": AccessionSynonym.LANGUAGE_VALIDATOR
        },
    }, perms={
        'accession.add_accession': _("You are not allowed to create an accession")
    }
)
def create_accession(request):
    name = request.data['name']
    code = request.data['code']
    dmm_id = int_arg(request.data['descriptor_meta_model'])
    parent_id = int_arg(request.data['parent'])
    descriptors = request.data['descriptors']
    language = request.data['language']

    # check uniqueness of the code for any type of synonym
    if AccessionSynonym.objects.filter(name=code).exists():
        raise SuspiciousOperation(_("The code of the accession is already used as a synonym name"))

    # check uniqueness of the code
    if Accession.objects.filter(code=code).exists():
        raise SuspiciousOperation(_("The code of the accession is already used"))

    if not Language.objects.filter(code=language).exists():
        raise SuspiciousOperation(_("The language is not supported"))

    content_type = get_object_or_404(ContentType, app_label="accession", model="accession")
    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

    try:
        with transaction.atomic():
            # common properties
            accession = Accession()
            accession.name = name
            accession.code = code
            accession.descriptor_meta_model = dmm

            # parent taxon or variety
            parent = get_object_or_404(Taxon, id=parent_id)
            accession.parent = parent

            # descriptors
            descriptors_builder = DescriptorsBuilder(accession)

            descriptors_builder.check_and_update(dmm, descriptors)
            accession.descriptors = descriptors_builder.descriptors

            accession.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()

            # initial synonym GRC code
            grc_code = AccessionSynonym(
                accession=accession,
                name=code,
                type=AccessionSynonym.TYPE_GRC_CODE,
                language='en')
            grc_code.save()

            # primary synonym if defined
            primary_name = AccessionSynonym(
                accession=accession,
                name=name,
                type=AccessionSynonym.TYPE_PRIMARY,
                language=language)
            primary_name.save()

            accession.synonyms.add(grc_code)
            accession.synonyms.add(primary_name)
    except IntegrityError as e:
        DescriptorModelType.integrity_except(Accession, e)

    response = {
        'id': accession.pk,
        'name': accession.name,
        'code': accession.code,
        'descriptor_meta_model': dmm.id,
        'parent': parent.id,
        'descriptors': descriptors,
        'synonyms': [
            {
                'id': grc_code.id,
                'name': grc_code.name,
                'type': grc_code.type,
                'language': grc_code.language
            },
            {
                'id': primary_name.id,
                'name': primary_name.name,
                'type': primary_name.type,
                'language': primary_name.language
            }
        ]
    }

    return HttpResponseRest(request, response)


@RestAccessionAccession.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_accession_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', "null"))
    limit = results_per_page
    # order_by = ['descriptors__IPGRI_4.1.1', 'descriptors__MCPD_ORIGCTY', 'name', 'id']
    # order_by = ['descriptors__MCPD_ORIGCTY', 'name', 'id']
    # order_by = ['geonames_country_name', 'id']
    # order_by = ['id']
    order_by = ['name', 'id']
    # order_by = ['parent__name']

    # from main.cursor import CursorQuery
    # cq = CursorQuery(Accession.objects, cursor, order_by)
    #
    # if request.GET.get('filters'):
    #     filters = json.loads(request.GET['filters'])
    #     cq.filters(filters)
    #
    # # Prefetch permit to have only 2 requests (clause order_by done directly, not per accession.synonyms)
    # qs = cq.query_set.select_related('parent').prefetch_related(
    #     Prefetch(
    #         "synonyms",
    #         queryset=AccessionSynonym.objects.all().order_by('type', 'language'))
    # ).distinct()  # .order_by(*order_by)[:limit]
    #
    # # qs = qs.extra(select={"geonames_country_name": "SELECT geonames_country.name FROM geonames_country WHERE (accession_accession.descriptors->>'MCPD_ORIGCTY')::INTEGER = geonames_country.id"})
    # # qs = qs.extra(params=["INNER JOIN geonames_country ON((accession_accession.descriptors->>'MCPD_ORIGCTY')::INTEGER = geonames_country.id"])
    # qs = cq.order_by(qs)[:limit]
    #
    # for accession in qs:
    #     a = {
    #         'id': accession.pk,
    #         'name': accession.name,
    #         'code': accession.code,
    #         'parent': accession.parent_id,
    #         'descriptor_meta_model': accession.descriptor_meta_model_id,
    #         'descriptors': accession.descriptors,
    #         'synonyms': [],
    #         'parent_details': {
    #             'id': accession.parent_id,
    #             'name': accession.parent.name,
    #             'rank': accession.parent.rank,
    #         },
    #         # 'geonames_country_name': accession.geonames_country_name
    #     }
    #     print(accession.geonames_country_name)
    #
    #     for synonym in accession.synonyms.all():
    #         a['synonyms'].append({
    #             'id': synonym.id,
    #             'name': synonym.name,
    #             'type': synonym.type,
    #             'language': synonym.language
    #         })
    #
    #     cq.add_item(a)
    #
    # cq.update()

    from main.cursor import ManualCursorQuery
    cq = ManualCursorQuery(Accession, cursor, order_by)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filters(filters)

    cq.prefetch_related(Prefetch(
            "synonyms",
            queryset=AccessionSynonym.objects.all().order_by('type', 'language')))

    # cq.join(Accession.parent, ['name', 'rank'])
    # cq.select_related('parent')
    cq.prefetch_related("parent")  # @or use aliases @todo how to avoid using that extra query and having the join ?

    # cq.join(Country, ['descriptors.MCPD_ORIGCTY', 'name'])  # @todo using descriptor model ?? to get foreign model...
    # from geonames.models import Country
    # cq.prefetch_related(Prefetch(
    #         "descriptors__MCPD_ORIGCTY",
    #         queryset=Country.objects.all()))

    cq.order_by().limit(limit)

    for accession in cq:
        a = {
            'id': accession.pk,
            'name': accession.name,
            'code': accession.code,
            'parent': accession.parent_id,
            'descriptor_meta_model': accession.descriptor_meta_model_id,
            'descriptors': accession.descriptors,
            'synonyms': [],
            'parent_details': {
                'id': accession.parent_id,
                'name': accession.parent.name,
                'rank': accession.parent.rank,
            }
        }

        for synonym in accession.synonyms.all():
            a['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'type': synonym.type,
                'language': synonym.language
            })

        cq.add_item(a)

    cq.finalize()

    results = {
        'perms': [],
        'items': cq.items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    # if request.GET.get('filters'):
    #     filters = json.loads(request.GET['filters'])
    #
    #     if cursor:
    #         cursor_name, cursor_id = cursor.rsplit('/', 1)
    #         qs = Accession.objects.filter(Q(name__gt=cursor_name) | (Q(name__gte=cursor_name) & Q(id__gt=cursor_id)))
    #     else:
    #         qs = Accession.objects.all()
    #
    #     name = filters.get('name', '')
    #
    #     # name search based on synonyms
    #     if filters.get('method', 'icontains') == 'icontains':
    #         qs = qs.filter(Q(synonyms__name__icontains=name))
    #     else:
    #         qs = qs.filter(Q(name__iexact=name)).filter(Q(synonyms__name__iexact=name))
    # else:
    #     if cursor:
    #         cursor_name, cursor_id = cursor.rsplit('/', 1)
    #         qs = Accession.objects.filter(Q(name__gt=cursor_name) | (Q(name__gte=cursor_name) & Q(id__gt=cursor_id)))
    #     else:
    #         qs = Accession.objects.all()
    #
    # # Prefetch permit to have only 2 requests (clause order_by done directly, not per accession.synonyms)
    # qs = qs.select_related('parent').prefetch_related(
    #     Prefetch(
    #         "synonyms",
    #         queryset=AccessionSynonym.objects.all().order_by('type', 'language'))
    # ).distinct().order_by(*order_by)[:limit]
    # print(qs.query)
    #
    # accession_list = []
    #
    # for accession in qs:
    #     a = {
    #         'id': accession.pk,
    #         'name': accession.name,
    #         'code': accession.code,
    #         'parent': accession.parent_id,
    #         'descriptor_meta_model': accession.descriptor_meta_model_id,
    #         'descriptors': accession.descriptors,
    #         'synonyms': [],
    #         'parent_details': {
    #             'id': accession.parent.id,
    #             'name': accession.parent.name,
    #             'rank': accession.parent.rank,
    #         }
    #     }
    #
    #     for synonym in accession.synonyms.all():
    #         a['synonyms'].append({
    #             'id': synonym.id,
    #             'name': synonym.name,
    #             'type': synonym.type,
    #             'language': synonym.language
    #         })
    #
    #     accession_list.append(a)
    #
    # if len(accession_list) > 0:
    #     # prev cursor (asc order)
    #     entity = accession_list[0]
    #     prev_cursor = "/".join(str(entity[field]) for field in order_by)
    #
    #     # next cursor (asc order)
    #     entity = accession_list[-1]
    #     next_cursor = "/".join(str(entity[field]) for field in order_by)
    # else:
    #     prev_cursor = None
    #     next_cursor = None
    #
    # results = {
    #     'perms': [],
    #     'items': accession_list,
    #     'prev': prev_cursor,
    #     'cursor': cursor,
    #     'next': next_cursor,
    # }

    return HttpResponseRest(request, results)


@RestAccessionId.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get an accession")
})
def get_accession_details_json(request, acc_id):
    """
    Get the details of an accession.
    """
    accession = Accession.objects.get(id=int(acc_id))

    # check permission on this object
    perms = get_permissions_for(request.user, accession.content_type.app_label, accession.content_type.model,
                                accession.pk)
    if 'accession.get_accession' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this accession'))

    result = {
        'id': accession.id,
        'name': accession.name,
        'code': accession.code,
        'parent': accession.parent.id,
        'synonyms': [],
        'descriptor_meta_model': accession.descriptor_meta_model.id,
        'descriptors': accession.descriptors
    }

    for s in accession.synonyms.all().order_by('type', 'language'):
        result['synonyms'].append({
            'id': s.id,
            'name': s.name,
            'type': s.type,
            'language': s.language,
        })

    return HttpResponseRest(request, result)


@RestAccessionSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), perms={
    'accession.search_accession': _("You are not allowed to search accessions")
})
def search_accession(request):
    """
    Quick search for an accession with a exact or partial name and meta model of descriptor.
    It is possible to have multiple results for a same accession because of the multiples synonyms.

    The filters can be :
        - name: value to look for the name field.
        - method: for the name 'ieq' or 'icontains' for insensitive case equality or %like% respectively.
        - meta_model: id of the descriptor meta-model to look for.
        - fields: list of fields to look for.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = Accession.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Accession.objects.all()

    name_method = filters.get('method', 'ieq')
    if 'meta_model' in filters['fields']:
        meta_model = int_arg(filters['meta_model'])

        if name_method == 'ieq':
            qs = qs.filter(Q(synonyms__name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = qs.filter(Q(synonyms__name__icontains=filters['name']))

        qs = qs.filter(Q(descriptor_meta_model_id=meta_model))
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
            queryset=AccessionSynonym.objects.exclude(type=AccessionSynonym.TYPE_GRC_CODE).order_by('type', 'language'))
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
        prev_cursor = "%s/%i" % (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = "%s/%i" % (obj['value'], obj['id'])
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


@RestAccessionId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "parent": {"type": "integer", "required": False},
            "entity_status": Accession.ENTITY_STATUS_VALIDATOR_OPTIONAL,
            "descriptors": {"type": "object", "required": False},
        },
    },
    perms={
        'accession.change_accession': _("You are not allowed to modify an accession"),
    })
def patch_accession(request, acc_id):
    accession = get_object_or_404(Accession, id=int(acc_id))

    entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")

    result = {
        'id': accession.id
    }

    try:
        with transaction.atomic():
            if 'parent' in request.data:
                parent = int(request.data['parent'])
                taxon = get_object_or_404(Taxon, id=parent)

                accession.parent = taxon
                result['parent'] = taxon.id

                accession.update_field('parent')

            if entity_status is not None and accession.entity_status != entity_status:
                accession.set_status(entity_status)
                result['entity_status'] = entity_status

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(accession)

                descriptors_builder.check_and_update(accession.descriptor_meta_model, descriptors)

                accession.descriptors = descriptors_builder.descriptors
                result['descriptors'] = accession.descriptors

                descriptors_builder.update_associations()

                accession.descriptors_diff = descriptors
                accession.update_field('descriptors')

            accession.save()
    except IntegrityError as e:
        DescriptorModelType.integrity_except(Accession, e)

    return HttpResponseRest(request, result)


@RestAccessionId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'accession.delete_accession': _("You are not allowed to delete an accession"),
})
def delete_accession(request, acc_id):
    accession = get_object_or_404(Accession, id=int(acc_id))

    accession.synonyms.clear()
    accession.delete()

    return HttpResponseRest(request, {})
