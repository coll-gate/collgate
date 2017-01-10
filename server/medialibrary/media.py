# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

import io
import os
import stat

from django.conf import settings
from django.core.exceptions import SuspiciousOperation
from django.http import HttpResponse
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.common.helpers import get_setting

from medialibrary.models import Media

from .base import RestMediaLibrary

logger = logging.getLogger('collgate')

# chunk size in bytes (to download a file)
CHUNK_SIZE = 65536


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


@RestMediaUUIDDownload.def_auth_request(Method.GET, Format.HTML)
def download_media_content(request, uuid):
    """
    Download the content of a file using its UUID.
    @see https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/
    @see https://bitbucket.org/renlinx007/django-fileprovider project for example
    """
    media = get_object_or_404(Media, uuid=uuid)

    storage_location = get_setting('medialibrary', 'storage_location')

    if settings.DEBUG:
        storage_path = get_setting('medialibrary', 'storage_path')
        if not os.path.isabs(storage_path):
            storage_path = os.path.abspath(storage_path)

        if not os.path.isdir(storage_path):
            raise SuspiciousOperation(_("Media library destination folder misconfiguration"))

        abs_filename = os.path.join(storage_path, media.name)
        local_file = open(abs_filename, "rb")

        # response = HttpResponse(content_type=media.mime_type)
        # response['Content-Disposition'] = 'attachment; filename="' + media.file_name + '"'
        # response.content = local_file

        response = StreamingHttpResponse(local_file, content_type=media.mime_type)
        response['Content-Disposition'] = 'attachment; filename="' + media.file_name + '"'
        response['Content-Length'] = media.file_size
    else:
        response = HttpResponse(content_type=media.mime_type)
        response['Content-Disposition'] = 'attachment; filename="' + media.file_name + '"'
        response['X-Accel-Redirect'] = "{0}/{1}".format(storage_location, media.name)

    return response


@RestMedia.def_auth_request(Method.POST, Format.JSON)
def upload_media(request, uuid):
    """
    Upload a media file from multi-part HTTP file request.
    @see https://docs.djangoproject.com/fr/1.10/ref/files/uploads/#custom-upload-handlers
    """
    storage_path = get_setting('medialibrary', 'storage_path')
    if not os.path.isabs(storage_path):
        storage_path = os.path.abspath(storage_path)

    if not os.path.isdir(storage_path):
        raise SuspiciousOperation(_("Media library destination folder misconfiguration"))

    if not request.FILES:
        raise SuspiciousOperation(_("No file specified"))

    up = request.FILES['file']

    # check file size
    if up.size > get_setting('medialibrary', 'max_file_size'):
        SuspiciousOperation(_("Upload file size limit is set to %i bytes") % get_setting('medialibrary', 'max_file_size'))

    # validate the file name and update it in way to be multi OS compliant
    # remove any '.' before and after
    name = up.name.strip('.')
    valid_name = io.StringIO()

    # replace forbidden characters by '_'
    for c in name:
        if ord(c) < 32 or c in ('<', '>', '"', '|', '\\', '`', '*', '?', ':', '/'):
            c = '_'

        valid_name.write(c)

    # @todo check mimetypes and same on PUT
    # mimetype = mimetypes.guess_type(os.path.basename(header.image.name))[0]

    media = Media()

    # generate two levels of path from the uuid node
    l1_path = '%x' % (((media.uuid.node & 0xffffff000000) >> 24) % 256)
    l2_path = '%x' % ((media.uuid.node & 0x000000ffffff) % 256)

    local_path = os.path.join(l1_path, l2_path)
    local_file_name = media.uuid

    media.name = os.path.join(local_path, local_file_name)
    media.version = 1
    media.mime_type = up.content_type
    media.file_name = valid_name.getvalue()

    # create the path if necessary
    abs_path = os.path.join(storage_path, local_path)
    if not os.direxists(abs_path):
        os.makedirs(abs_path, 0o770)

    abs_file_name = os.path.join(abs_path, local_file_name)
    dst_file = open(abs_file_name, "wb")

    # copy file content
    for chunk in up.chunks():
        dst_file.write(chunk)

    dst_file.close()

    # 0660 on file
    os.chmod(local_file_name, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP)

    media.save()

    result = {
        'id': media.id,
        'uuid': media.uuid,
        'name': media.name,
        'created_date': media.created_date,
        'modified_date': media.modified_date,
        'file_name': media.file_name,
        'file_size': media.file_size
    }

    return HttpResponseRest(request, result)


@RestMediaUUID.def_auth_request(Method.PUT, Format.JSON)
def update_upload_media(request, uuid):
    """
    Upload a media file from multi-part HTTP file request.
    """
    storage_path = get_setting('medialibrary', 'storage_path')
    if not os.path.isabs(storage_path):
        storage_path = os.path.abspath(storage_path)

    if not os.path.isdir(storage_path):
        raise SuspiciousOperation(_("Media library destination folder misconfiguration"))

    if not request.FILES:
        raise SuspiciousOperation(_("No file specified"))

    up = request.FILES['file']

    # check file size
    if up.size > get_setting('medialibrary', 'max_file_size'):
        SuspiciousOperation(_("Upload file size limit is set to %i bytes") % get_setting('medialibrary', 'max_file_size'))

    media = get_object_or_404(Media, uuid=uuid)
    version = media.version + 1

    abs_file_name = os.path.join(storage_path, media.name)

    if not os.path.isfile(abs_file_name):
        SuspiciousOperation(_("Trying to update a non-existing file"))

    dst_file = open(abs_file_name, "wb")

    # copy file content
    for chunk in up.chunks():
        dst_file.write(chunk)

    dst_file.close()

    # 0660 on file
    os.chmod(abs_file_name, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP)

    # upgrade the version number and file size
    media.version = version
    media.file_size = up.size
    media.mime_type = up.content_type
    media.save()

    result = {
        'id': media.id,
        'uuid': media.uuid,
        'version': media.version,
        'mime_type': media.content_type,
        'file_size': media.file_size,
        'modified_date': media.modified_date
    }

    return HttpResponseRest(request, result)
