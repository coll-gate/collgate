# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

import io

from django.core.exceptions import SuspiciousOperation
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.common.helpers import get_setting

from medialibrary.models import Media

from .base import RestMediaLibrary

logger = logging.getLogger('collgate')


class RestMedia(RestMediaLibrary):
    regex = r'^media/$'
    suffix = 'media'


class RestMediaUUID(RestMedia):
    regex = r'^(?P<uuid>[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/$'
    suffix = 'uuid'


class RestMediaUUIDUpload(RestMediaUUID):
    regex = r'^upload/$'
    suffix = 'upload'


class RestMediaUUIDDownload(RestMediaUUID):
    regex = r'^download/$'
    suffix = 'download'


@RestMediaUUID.def_auth_request(Method.GET, Format.JSON)
def get_media(request, uuid):
    """

    :param request:
    :param uuid:
    :return:
    """

    result = {}

    return HttpResponseRest(request, result)


@RestMediaUUID.def_auth_request(Method.GET, Format.JSON)
def download_media_content(request, uuid):
    """
    Download the content of a file using its UUID.
    @todo could be multi-part download, using file read position...

    :param request:
    :param uuid:
    :return:
    """

    media = get_object_or_404(Media, uuid=uuid)

    local_filename = get_setting('medialibrary', 'storage_location') + '/' + media.file

    local_file = open(local_filename, "rb")

    file_content = local_file.readall()

    local_file.close()

    response = HttpResponse(content_type=Format.TEXT.content_type)
    response['Content-Disposition'] = 'attachment; filename="' + media.name + '"'
    response.write(file_content)

    return response


@RestMedia.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 1, 'maxLength': 255},
            "mime_type": {"type": "string", 'minLength': 3, 'maxLength': 255},
            "size": {"type": "integer", 'minimum': 0, 'maximum': get_setting('medialibrary', 'max_file_size')}
        }
    }, perms={})
def create_media(request):
    """
    Create a new media entry before uploading it.
    """

    media = Media()

    # validate the file name and update it in way to be multi OS compliant
    # remove any '.' before and after
    name = request.data['name'].strip('.')
    valid_name = io.StringIO()

    # replace forbidden characters by '_'
    for c in name:
        if ord(c) < 32 or c in ('<', '>', '"', '|', '\\', '`', '*', '?', ':', '/'):
            c = '_'

        valid_name.write(c)

    media.name = valid_name.getvalue()

    media.mime_type = request.data['mime_type']
    media.file_size = request.data['size']

    media.save()

    result = {
        'id': media.id,
        'uuid': media.uuid,
        'name': media.name,
        'created_date': media.created_date,
        'modified_date': media.modified_date,
        'file_name': None
    }

    return HttpResponseRest(request, result)


@RestMediaUUID.def_auth_request(Method.POST, Format.JSON)
def upload_media(request, uuid):
    """
    Upload a media file from multi-part HTTP file request.
    """
    media = get_object_or_404(Media, uuid=uuid)

    if not request.FILES:
        raise SuspiciousOperation(_("No file specified"))

    up = request.FILES['file']

    # check file size
    if up.size > get_setting('medialibrary', 'max_file_size'):
        SuspiciousOperation(_("Upload file size limit is set to %i bytes") % get_setting('medialibrary', 'max_file_size'))

    if up.size != media.size:
        SuspiciousOperation(_("Real file size differs from the previously declared size"))

    file_name = media.uuid
    path = '/'.join(media.created_date.year, media.created_date.month, media.created_date.day)

    # create the path if necessary
    # @todo

    # make the storage location base path absolute
    # @todo
    storage_location = get_setting('medialibrary', 'storage_location')

    local_file_name = '/'.join(storage_location, path, file_name)
    dst_file = open(local_file_name, "wb+")

    # copy file content
    for chunk in up.chunks():
        dst_file.write(chunk)

    dst_file.close()

    return HttpResponseRest(request, {})
