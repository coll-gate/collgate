# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

import io
import mimetypes
import os
import stat
import magic

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.http import HttpResponse
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from medialibrary.models import Media
from permission.utils import get_permissions_for

from . import localsettings
from .base import RestMediaLibrary

logger = logging.getLogger('collgate')


class RestMedia(RestMediaLibrary):
    regex = r'^media/$'
    suffix = 'media'


class RestMediaUpload(RestMedia):
    regex = r'^upload/$'
    suffix = 'upload'


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
    Returns the media details (mime-type, file name, size...) but not the file content.
    """
    media = get_object_or_404(Media, uuid=uuid)

    # check user permission on the media
    if media.owner_content_type == "auth.user":
        if media.owner_object_id != request.user.pk:
            raise PermissionDenied(_('Your are not the owner of the media'))
    else:
        perms = get_permissions_for(request.user,
                                    media.owner_content_type.app_label,
                                    media.owner_content_type.model,
                                    media.owner_object_id)
        if len(perms) == 0:
            raise PermissionDenied(_('No permissions to the owner entity'))

    result = {
        'id': media.pk,
        'uuid': media.uuid,
        'name': media.name,
        'created_date': media.created_date,
        'modified_date': media.modified_date,
        'file_name': media.file_name,
        'file_size': media.file_size,
        'mime_type': media.mime_type
    }

    return HttpResponseRest(request, result)


@RestMediaUUID.def_auth_request(Method.DELETE, Format.JSON)
def delete_media(request, uuid):
    """
    Delete an existing media if the actual owner is the user of the upload.
    """
    media = get_object_or_404(Media, uuid=uuid)

    # check user permission on the media
    if media.owner_content_type != "auth.user" or media.owner_object_id != request.user.pk:
        raise PermissionDenied(_("Your are not the owner of the media"))

    try:
        # delete the related file
        abs_filename = os.path.join(localsettings.storage_path, media.name)

        if os.path.exists(abs_filename):
            os.remove(abs_filename)

        # and the model
        media.delete()
    except:
        raise SuspiciousOperation(_("Unable to delete the media"))

    return HttpResponseRest(request, {})


@RestMediaUUIDDownload.def_auth_request(Method.GET, Format.HTML)
def download_media_content(request, uuid):
    """
    Download the content of a file using its UUID.
    @see https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/
    @see https://bitbucket.org/renlinx007/django-fileprovider project for example
    """
    media = get_object_or_404(Media, uuid=uuid)

    # check user permission on the media
    if media.owner_content_type == "auth.user":
        if media.owner_object_id != request.user.pk:
            raise PermissionDenied(_('Your are not the owner of the media'))
    else:
        perms = get_permissions_for(request.user,
                                    media.owner_content_type.app_label,
                                    media.owner_content_type.model,
                                    media.owner_object_id)
        if len(perms) == 0:
            raise PermissionDenied(_('No permissions to the owner entity'))

    if settings.DEBUG:
        abs_filename = os.path.join(localsettings.storage_path, media.name)
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
        response['X-Accel-Redirect'] = "{0}/{1}".format(localsettings.storage_location, media.name)

    return response


@RestMediaUpload.def_auth_request(Method.POST, Format.JSON)
def upload_media(request):
    """
    Upload a media file from multi-part HTTP file request.
    @see https://docs.djangoproject.com/fr/1.10/ref/files/uploads/#custom-upload-handlers
    """
    if not request.FILES:
        raise SuspiciousOperation(_("No file specified"))

    up = request.FILES['file']

    # check file size
    if up.size > localsettings.max_file_size:
        SuspiciousOperation(_("Upload file size limit is set to %i bytes") % localsettings.max_file_size)

    # simple check mime-types using the file extension (can process a test using libmagic)
    guessed_mime_type = mimetypes.guess_type(up.name)[0]
    if guessed_mime_type is None:
        SuspiciousOperation(_("Undetermined uploaded file type"))

    # validate the file name and update it in way to be multi OS compliant
    # remove any '.' before and after
    name = up.name.strip('.')
    valid_name = io.StringIO()

    # replace forbidden characters by '_'
    for c in name:
        if ord(c) < 32 or c in ('<', '>', '"', '|', '\\', '`', '*', '?', ':', '/'):
            c = '_'

        valid_name.write(c)

    media = Media()

    # generate two levels of path from the uuid node
    l1_path = '%02x' % (((media.uuid.node & 0xffffff000000) >> 24) % 256)
    l2_path = '%02x' % ((media.uuid.node & 0x000000ffffff) % 256)

    local_path = os.path.join(l1_path, l2_path)
    local_file_name = str(media.uuid)

    media.name = os.path.join(local_path, local_file_name)
    media.version = 1
    media.file_name = valid_name.getvalue()

    # default owner is the user of the upload
    media.owner_content_type = ContentType.objects.get_by_natural_key("auth", "user")
    media.owner_object_id = request.user.pk

    # create the path if necessary
    abs_path = os.path.join(localsettings.storage_path, local_path)
    if not os.path.exists(abs_path):
        os.makedirs(abs_path, 0o770)

    abs_file_name = os.path.join(abs_path, local_file_name)
    dst_file = open(abs_file_name, "wb")

    # test mime-type with a buffer of a least 1024 bytes
    test_mime_buffer = io.BytesIO()

    # copy file content
    for chunk in up.chunks():
        dst_file.write(chunk)

        if test_mime_buffer.tell() < 1024:
            test_mime_buffer.write(chunk)

    dst_file.close()

    guessed_mime_type = magic.from_buffer(test_mime_buffer.getvalue(), mime=True)

    # 0660 on file
    os.chmod(abs_file_name, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP)

    media.mime_type = guessed_mime_type  # up.content_type

    # save the model once file is correctly saved
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
    if not request.FILES:
        raise SuspiciousOperation(_("No file specified"))

    up = request.FILES['file']

    # check file size
    if up.size > localsettings.max_file_size:
        SuspiciousOperation(_("Upload file size limit is set to %i bytes") % localsettings.max_file_size)

    # simple check mime-types using the file extension (can process a test using libmagic)
    guessed_mime_type = mimetypes.guess_type(up.name)[0]
    if guessed_mime_type is None:
        SuspiciousOperation(_("Undetermined uploaded file type"))

    media = get_object_or_404(Media, uuid=uuid)

    # check user permission on the media
    if media.owner_content_type == "auth.user":
        if media.owner_object_id != request.user.pk:
            raise PermissionDenied(_('Your are not the owner of the media'))
    else:
        perms = get_permissions_for(request.user,
                                    media.owner_content_type.app_label,
                                    media.owner_content_type.model,
                                    media.owner_object_id)

        if '%s.change_%s' % (media.owner_content_type.app_label, media.owner_content_type.model) not in perms:
            raise PermissionDenied(_('No change permission to the owner entity'))

    version = media.version + 1

    abs_file_name = os.path.join(localsettings.storage_path, media.name)

    if not os.path.isfile(abs_file_name):
        SuspiciousOperation(_("Trying to update a non-existing file"))

    dst_file = open(abs_file_name, "wb")

    # test mime-type with a buffer of a least 1024 bytes
    test_mime_buffer = io.BytesIO()

    # copy file content
    for chunk in up.chunks():
        dst_file.write(chunk)

        if test_mime_buffer.tell() < 1024:
            test_mime_buffer.write(chunk)

    dst_file.close()

    guessed_mime_type = magic.from_buffer(test_mime_buffer.getvalue(), mime=True)

    # 0660 on file
    os.chmod(abs_file_name, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP)

    # upgrade the version number and file size
    media.version = version
    media.file_size = up.size
    media.mime_type = guessed_mime_type  # up.content_type

    # update the model once file is correctly saved
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
