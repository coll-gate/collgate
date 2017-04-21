# -*- coding: utf-8; -*-
#
# @file eventmessage.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Views related to the event message model.
"""
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.views.decorators.cache import cache_page

from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .models import InterfaceLanguages, EventMessage
from .main import RestMain


class RestEventMessage(RestMain):
    regex = r'^event-message/$'
    suffix = 'event-message'


class RestEventMessageId(RestEventMessage):
    regex = r'^(?P<evt_id>[0-9]+)/$'
    suffix = 'id'


@cache_page(5*60)
@RestEventMessage.def_auth_request(Method.GET, Format.JSON)
def get_event_messages(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_time, cursor_id = cursor.rsplit('/', 1)
        qs = EventMessage.objects.filter(Q(timestamp__lt=cursor_time) | (
            Q(timestamp=cursor_time) & Q(id__lt=cursor_id)))
    else:
        qs = EventMessage.objects.all()

    qs = qs.prefetch_related('author').order_by('-created_date').order_by('-id')[:limit]

    lang = translation.get_language()

    items_list = []
    for event in qs:
        messages = json.loads(event.message)
        if lang in messages:
            message = messages[lang]
        else:
            message = ""

        e = {
            'id': event.pk,
            'created_date': event.created_date,
            'author': event.author.pk,
            'author_details': {
                'first_name': event.author.first_name,
                'last_name': event.author.last_name
            },
            'message': message
        }

        items_list.append(e)

    if len(items_list) > 0:
        item = items_list[0]
        prev_cursor = "%s/%s" % (item['created_date'].isoformat(), item['id'])

        item = items_list[-1]
        next_cursor = "%s/%s" % (item['created_date'].isoformat(), item['id'])
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


@RestEventMessageId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'main.delete_eventmessage': _("You are not allowed to delete an event message"),
})
def delete_event_message(request, evt_id):
    event_message = get_object_or_404(EventMessage, id=int(evt_id))
    event_message.delete()

    return HttpResponseRest(request, {})


@RestEventMessage.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "additionalProperties": {
        "type": "string",
        "maxLength": 255
    }
}, perms={'main.add_eventmessage': _('You are not allowed to create an event message')}
)
def create_event_message(request):
    """
    Create a new event message with multiple languages.
    """
    messages = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in messages.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    event = EventMessage(author=request.user, message=json.dumps(messages))
    event.save()

    lang = translation.get_language()

    if lang in messages:
        message = messages[lang]
    else:
        message = ""

    response = {
        'id': event.id,
        'created_date': event.created_date,
        'author': event.author.id,
        'author_details': {
            'first_name': event.author.first_name,
            'last_name': event.author.last_name
        },
        'message': message
    }

    return HttpResponseRest(request, response)

