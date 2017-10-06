# -*- coding: utf-8; -*-
#
# @file base.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import datetime
import random
import hashlib

from django.core.signing import TimestampSigner

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.profile import update_setting

MESSENGERID_KEY_LENGTH = 50


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

    print(request.user.get_session_auth_hash())

    hash = hashlib.sha1()
    hash.update(random_key.encode('utf-8'))

    digest = hash.hexdigest()

    signer = TimestampSigner()
    messengerid = signer.sign(digest)

    # set it to user settings data
    update_setting(request.user, "messengerid", messengerid, "1.0")

    results = {
        'messengerid': messengerid
    }

    return HttpResponseRest(request, results)
