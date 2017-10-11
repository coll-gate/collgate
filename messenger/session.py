# -*- coding: utf-8; -*-
#
# @file routing.py
# @brief Application Django channels routing
# @authors Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import datetime


class Session:

    def __init__(self):
        self.sessions_by_username = {}
        self.sessions_by_reply_channel = {}
        self.waiting_sessions = {}

    def get_session(self, reply_channel):
        return self.sessions_by_reply_channel.get(reply_channel)

    def setup_session(self, messengerid, reply_channel, username):
        session = self.waiting_sessions.get(username)

        if session is None:
            return None

        if session['messengerid'] != messengerid:
            return None

        if session['username'] != username:
            return None

        # expired session
        if session['expire'] <= datetime.datetime.now():
            del self.waiting_sessions[username]
            return None

        session['auth'] = True

        self.sessions_by_reply_channel[reply_channel] = session
        self.sessions_by_username[session['username']] = session

        del self.waiting_sessions[username]

        return session

    def has_session(self, reply_channel):
        return reply_channel in self.sessions_by_reply_channel

    def unset_session(self, reply_channel):
        session_by_reply_channel = self.sessions_by_reply_channel.get(reply_channel)
        if session_by_reply_channel is None:
            return

        username = session_by_reply_channel['username']

        if reply_channel in self.sessions_by_reply_channel:
            del self.sessions_by_reply_channel[reply_channel]

        if username in self.sessions_by_username:
            del self.sessions_by_username[username]

    def get_session(self, reply_channel):
        return self.sessions_by_reply_channel.get(reply_channel)

    def register_session(self, username, messengerid, validity):
        session = {
            'auth': False,
            'username': username,
            'connection': datetime.datetime.now(),
            'expire': datetime.datetime.now() + datetime.timedelta(seconds=validity),
            'messengerid': messengerid,
            'data': {}
        }

        self.waiting_sessions[username] = session


session_manager = Session()
