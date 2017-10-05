# -*- coding: utf-8; -*-
#
# @file accessionclassificationentry.py
# @brief coll-gate accession classification rest handler
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-09-25
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.exceptions import SuspiciousOperation
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from classification.models import ClassificationEntry, ClassificationEntrySynonym
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from main.cursor import CursorQuery
from permission.utils import get_permissions_for

from .accession import RestAccessionId
from .models import Accession, AccessionClassificationEntry


class RestAccessionIdClassificationEntry(RestAccessionId):
    regex = r'^classificationentry/$'
    name = 'classificationentry'


class RestAccessionIdClassificationEntryCount(RestAccessionIdClassificationEntry):
    regex = r'^count/$'
    name = 'count'


@RestAccessionIdClassificationEntry.def_auth_request(Method.GET, Format.JSON)
def get_accession_id_classification_entry_list(request, acc_id):
    """
    Get a list of classification for an accession in JSON
    """
    sort_by = json.loads(request.GET.get('sort_by', '[]'))
    accession = get_object_or_404(Accession, id=int(acc_id))

    # check permission on this object
    perms = get_permissions_for(request.user, accession.content_type.app_label, accession.content_type.model,
                                accession.pk)
    if 'accession.get_accession' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this accession'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    tmp_order_by = []
    for field in order_by:
        f = field.lstrip('+-#')
        is_descriptor = field[0] == '#' or field[1] == '#'

        if f == 'id':
            continue

        if is_descriptor:
            # only if sub-value of descriptor
            if CursorQuery.FIELDS_SEP in f:
                tmp_order_by.append('#' + 'classification_entry->' + f)
        else:
            if field.startswith('-'):
                tmp_order_by.append('-classification_entry->' + f)
            else:
                tmp_order_by.append('+classification_entry->' + f)

    order_by = tmp_order_by

    cq = CursorQuery(AccessionClassificationEntry)

    cq.filter(accession=accession.id)
    cq.select_related('classification_entry')

    cq.prefetch_related(Prefetch(
        "classification_entry__synonyms",
        queryset=ClassificationEntrySynonym.objects.all().order_by('synonym_type', 'language')))

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.order_by(order_by)

    classification_entry_items = []

    for accession_classification_entry in cq:
        c = {
            'id': accession_classification_entry.classification_entry.id,
            'name': accession_classification_entry.classification_entry.name,
            'parent': accession_classification_entry.classification_entry.parent_id,
            'rank': accession_classification_entry.classification_entry.rank_id,
            'descriptor_meta_model': accession_classification_entry.classification_entry.descriptor_meta_model_id,
            'descriptors': accession_classification_entry.classification_entry.descriptors,
            'parent_list': accession_classification_entry.classification_entry.parent_list,
            'synonyms': []
        }

        # @todo why prefetch is not used ? maybe cache field name problem, else make a manual query
        # maybe need a _synonyms_cache field ?
        # for synonym in accession_classification_entry.classification_entry.synonyms.all():
        #     c['synonyms'].append({
        #         'id': synonym.id,
        #         'name': synonym.name,
        #         'synonym_type': synonym.synonym_type_id,
        #         'language': synonym.language
        #     })

        classification_entry_items.append(c)

    results = {
        'perms': [],
        'items': classification_entry_items
    }

    return HttpResponseRest(request, results)


@RestAccessionIdClassificationEntryCount.def_auth_request(Method.GET, Format.JSON)
def list_accession_id_classification_entry_count(request, acc_id):
    """
    Get a count of the list of classification for an accession in JSON
    """
    classification_entries = ClassificationEntry.objects.filter(accession_id=int(acc_id))

    results = {
        'perms': [],
        'count': classification_entries.count()
    }

    return HttpResponseRest(request, results)


@RestAccessionIdClassificationEntry.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "action": {"type": "string", "pattern": "^(add|remove)$"},
            "target": {"type": "string", "pattern": "^classification_entry$"},
            "classification_entry": {"type": "integer", "required": False}
        },
    },
    perms={
        'accession.change_accession': _("You are not allowed to change an accession")
    })
def change_accession_id_classification_entry(request, acc_id):
    """
    Remove a secondary classification from an accession
    """
    action = request.data['action']
    target = request.data['target']

    accession = get_object_or_404(Accession, id=int(acc_id))

    # check permission on this object
    perms = get_permissions_for(request.user, accession.content_type.app_label, accession.content_type.model,
                                accession.pk)
    if 'accession.get_accession' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this accession'))

    if target == "classification_entry":
        classification_entry_id = int_arg(request.data['classification_entry'])

        if action == "add":
            if not request.user.has_perm('accession.add_accessionclassificationentry'):
                raise PermissionDenied(_("You are not allowed to add an entry of classification to an accession"))

            if classification_entry_id == accession.primary_classification_entry_id:
                raise SuspiciousOperation(_('Already defined as primary classification'))

            classification_entry = get_object_or_404(ClassificationEntry, id=classification_entry_id)

            if AccessionClassificationEntry.objects.filter(accession=accession, classification_entry=classification_entry).exists():
                raise SuspiciousOperation(_('It is not permit to add twice the same classification entry'))

            AccessionClassificationEntry.objects.create(
                accession=accession, classification_entry=classification_entry, primary=False)

        elif action == "remove":
            if not request.user.has_perm('accession.delete_accessionclassificationentry'):
                raise PermissionDenied(_("You are not allowed to remove an entry of classification from an accession"))

            if classification_entry_id == accession.primary_classification_entry:
                raise SuspiciousOperation(_('It is not permit to remove the primary classification entry'))

            accession.classifications_entries.filter(classification_entry_id=classification_entry_id).delete()
        else:
            raise SuspiciousOperation('Invalid action')

    return HttpResponseRest(request, {})
