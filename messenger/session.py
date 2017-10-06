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
        self.sessions = {}

    def get_session(self, messengerid):
        return self.sessions.get(messengerid)

    def add_session(self, messengerid, username):
        # @todo expire
        session = {
            'username': username,
            'connection': datetime.datetime.now(),
            'expire': datetime.datetime.now() + datetime.timedelta(hours=24),
            'data': {}
        }

        self.sessions[messengerid] = session
        return session

    def has_session(self, messengerid):
        return messengerid in self.sessions

    def remove_session(self, messengerid):
        if messengerid in self.sessions:
            del self.sessions

    def get_session(self):
        return self.sessions


# @todo managed session expiration

session_manager = Session()
