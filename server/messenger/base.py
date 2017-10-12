# -*- coding: utf-8; -*-
#
# @file base.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import random
import hashlib

from django.core.signing import TimestampSigner

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.module.manager import module_manager

from .localsettings import MESSENGERID_KEY_LENGTH
from messenger.commands import COMMAND_AUTH_SESSION


class RestMessenger(RestHandler):
    regex = r'^messenger/$'
    name = 'messenger'


class RestMessengerMessengerId(RestMessenger):
    regex = r'^messengerid/$'
    name = 'messengerid'


@RestMessengerMessengerId.def_auth_request(Method.GET, Format.JSON)
def get_messenger_id(request):
    # generate messenger id token
    random_key = ''.join(
        [random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-') for i in range(MESSENGERID_KEY_LENGTH)])

    hash = hashlib.sha1()
    hash.update(random_key.encode('utf-8'))

    digest = hash.hexdigest()

    signer = TimestampSigner()
    messengerid = signer.sign(digest)

    messenger_module = module_manager.get_module('messenger')
    messenger_module.tcp_client.message(
        COMMAND_AUTH_SESSION, {
            'username': request.user.username,
            'messengerid': messengerid,
            'validity': request.session.get_expiry_age()
         })

    results = {
        'messengerid': messengerid,
        'host': get_setting('messenger', 'messenger_host'),
        'port': get_setting('messenger', 'messenger_port'),
        'path': get_setting('messenger', 'messenger_path')
    }

    return HttpResponseRest(request, results)
