# -*- coding: utf-8; -*-
#
# @file consumers.py
# @brief Application Django channels message consumers
# @authors Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import base64
import hashlib
import hmac
import json
import re
import urllib

from channels import Group
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.signing import TimestampSigner, SignatureExpired
from django.db import connection

from messenger.localsettings import SECRET_KEY
from messenger.session import session_manager


def session_utoken(msg, secret_key, class_name='SessionStore'):
    key_salt = "django.contrib.sessions" + class_name
    sha1 = hashlib.sha1((key_salt + secret_key).encode('utf-8')).digest()
    utoken = hmac.new(sha1, msg=msg, digestmod=hashlib.sha1).hexdigest()
    return utoken


def decode(session_data, secret_key, class_name='SessionStore'):
    encoded_data = base64.b64decode(session_data)
    utoken, pickled = encoded_data.split(b':', 1)
    expected_utoken = session_utoken(pickled, secret_key, class_name)
    if utoken.decode() != expected_utoken:
        raise BaseException('Session data corrupted "%s" != "%s"',
                            utoken.decode(),
                            expected_utoken)
    return json.loads(pickled.decode('utf-8'))


# def http_consumer(message):
#     # Make standard HTTP response - access ASGI path attribute directly
#     response = HttpResponse("Hello world! You asked for %s" % message.content['path'])
#     # Encode that response into message format (ASGI)
#     for chunk in AsgiHandler.encode_response(response):
#         message.reply_channel.send(chunk)


def ws_message(message):
    pass
    # content = json.loads(message.content['text'])
    #
    # result = {
    #     'content': content
    # }
    #
    # message.reply_channel.send({'text': json.dumps(result)})


def get_session_id(message):
    sessionid = None

    headers = message.content['headers']
    for header in headers:
        if len(header) > 1 and header[0] == b'cookie':
            for v in header:
                values = v.decode('utf8').split('; ')
                for value in values:
                    if value.startswith('sessionid='):
                        sessionid = value.lstrip('sessionid=')
                        break

            if sessionid:
                break

        if sessionid:
            break

    return sessionid


def ws_connect(message):
    query_string = message.content.get('query_string', b'').decode('utf8')
    parameters = urllib.parse.parse_qs(query_string)

    username = parameters.get('username', [''])[0]
    messengerid = parameters.get('messengerid', [''])[0]

    if not re.match(r'[a-zA-Z0-9_]{3,100}', username):
        message.reply_channel.send({'accept': False})
        return

    if not re.match(r'[a-zA-Z0-9_\-:]{50,100}', messengerid):
        message.reply_channel.send({'accept': False})
        return

    if not username or not messengerid:
        message.reply_channel.send({'accept': False})
        return

    UserModel = get_user_model()

    # get user from DB
    try:
        user = UserModel.objects.get(username=username)
    except UserModel.DoesNotExist:
        message.reply_channel.send({'accept': False})
        return

    # check validity
    signer = TimestampSigner(SECRET_KEY)

    try:
        messengerid_org = signer.unsign(messengerid, max_age=60)
    except SignatureExpired:
        message.reply_channel.send({'accept': False})
        return

    if session_manager.setup_session(messengerid, message.reply_channel, username) is None:
        message.reply_channel.send({'accept': False})
        return

    # add to group of command type default
    Group("default").add(message.reply_channel)

    message.reply_channel.send({'accept': True})


def ws_disconnect(message):
    Group("default").discard(message.reply_channel)
    session_manager.unset_session(message.reply_channel)
