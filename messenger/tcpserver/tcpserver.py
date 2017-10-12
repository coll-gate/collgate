# -*- coding: utf-8; -*-
#
# @file tcpserver.py
# @brief Application Django channels message consumers
# @authors Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-09
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import io
import json
import logging
import select
import socketserver

from threading import Lock
from channels import Group

from messenger.session import session_manager
from messenger.commands import COMMAND_CACHE_INVALIDATION, COMMAND_AUTH_SESSION, COMMAND_ONLINE, COMMAND_OFFLINE

logger = logging.getLogger('collgate-messenger')


class RWBuffer:

    def __init__(self):
        self.read_pos = 0
        self.write_pos = 0
        self.buffer = io.BytesIO()

    def write(self, data):
        self.buffer.write(data)
        self.write_pos += len(data)

        return self.write_pos - self.read_pos

    def read(self, size):
        if self.read_pos < self.write_pos:
            right_pos = min(size + self.read_pos, self.write_pos)
            data = self.buffer.getbuffer()[self.read_pos:right_pos]

            self.read_pos += len(data)
            self.buffer.flush()

            return bytes(data)
        else:
            return bytes([])

    def peek(self, size):
        if self.read_pos < self.write_pos:
            right_pos = min(size + self.read_pos, self.write_pos)
            data = self.buffer.getbuffer()[self.read_pos:right_pos]

            return bytes(data)
        else:
            return bytes([])

    def seek(self, method, size):
        if method == io.SEEK_CUR:
            dist = min(size, self.write_pos - self.read_pos)
            self.read_pos += dist

            return dist
        else:
            return 0

    def size(self):
        return max(0, self.write_pos - self.read_pos)


class TCPHandler(socketserver.BaseRequestHandler):
    """
    Connection coming from front-ends (server).
    """

    def setup(self):
        self.lock = Lock()

        self.recv_list = []
        self.send_list = []

        self._closed = False

        self.in_rw = RWBuffer()

        # self.request.setblocking(False)
        self.request.settimeout(0.1)

        super().setup()

    def read_messages(self):
        while True:
            head = self.in_rw.peek(4)

            if len(head) < 4:
                return

            command_type = head[1]
            message_size = head[2] | (head[3] << 8)

            # message and is complete
            if head[0] == 0 and self.in_rw.size() >= message_size:
                self.in_rw.seek(io.SEEK_CUR, 4)
                buffer = self.in_rw.read(message_size)

                in_message = json.loads(buffer.decode('utf-8'))

                self.lock.acquire()
                self.recv_list.append((command_type, in_message))
                self.lock.release()

                logger.info("Received: {}".format(in_message))
            else:
                break

    def process_incoming(self):
        while True:
            try:
                recv_data = self.request.recv(1024)
            except OSError as e:
                break

            if len(recv_data) > 0:
                self.in_rw.write(recv_data)
            else:
                self._closed = True
                break

    def process_outgoing(self):
        self.lock.acquire()
        if len(self.send_list):
            command_type, out_message = self.send_list.pop()
            self.lock.release()

            # 0 for message start
            # 1 bytes command type
            # 2 bytes message size
            # ... message content
            buffer = bytes([
                0,
                command_type,
                len(out_message) & 0xff,
                (len(out_message) >> 8) & 0xff]) + out_message.encode('utf-8')

            self.request.sendall(buffer)

            logger.info("Sent:     {}".format(out_message))
        else:
            self.lock.release()

    def handle(self):
        inout = [self.request]
        self.peername = "%s:%i" % self.request.getpeername()

        logger.info("%s client initiated a connection !" % self.peername)

        self.request.settimeout(0.1)

        while True:
            # peer closed connection
            if self._closed:
                logger.info("%s client closed connection !" % self.peername)
                break

            infds, outfds, errfds = select.select(inout, inout, [], self.request.gettimeout())

            if len(infds):
                self.process_incoming()

            self.process_outgoing()

            self.read_messages()
            self.dispatch()

        # remaining messages
        self.read_messages()
        self.dispatch()

    def message(self, command_type, message):
        self.lock.acquire()
        self.send_list.append((command_type, json.dumps(message)))
        self.lock.release()

    def dispatch(self):
        self.lock.acquire()
        messages = self.recv_list.copy()
        self.recv_list.clear()
        self.lock.release()

        # avoid redundancies commands
        lookup = set()

        # dispatch to default group cache invalidation commands
        for command_type, message in messages:
            # dispatch to any connected web-clients
            if command_type == COMMAND_CACHE_INVALIDATION:
                # multiples commands
                if "%s__%s" % (message['category'], message['name']) in lookup:
                    continue

                lookup.add("%s__%s" % (message['category'], message['name']))

                # Add them to the chat group
                content = json.dumps({'command': command_type, 'data': message})

                # to the group
                Group("default").send({'text': content})

            # only for messenger service
            if command_type == COMMAND_AUTH_SESSION:
                messengerid = message['messengerid']
                validity = message['validity']
                username = message['username']

                session_manager.register_session(username, messengerid, validity)


tcp_server = None
tcp_server_thread = None
