# -*- coding: utf-8; -*-
#
# @file base.py
# @brief
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import io
import json
import socket
import threading
import select

import time

from .localsettings import MESSENGER_HOST, MESSENGER_PORT


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


class TCPClient(threading.Thread):

    def __init__(self):
        threading.Thread.__init__(self)

        self._lock = threading.Lock()
        self.sock = None
        self.send_list = []
        self.recv_list = []
        self.in_rw = RWBuffer()
        self.status = 0
        self._closed = False
        self._sync = threading.Semaphore()

    def __del__(self):
        self.disconnect()

    def process_outgoing(self):
        self._lock.acquire()
        if len(self.send_list):
            command_type, out_message = self.send_list.pop()
            self._lock.release()

            # 0 for message start
            # 1 byte command type
            # 2 bytes message size
            # ... message content
            buffer = bytes([
                0,
                command_type,
                len(out_message) & 0xff,
                (len(out_message) >> 8) & 0xff]) + out_message.encode('utf-8')

            self.sock.sendall(buffer)

            # print("Sent:     {}".format(out_message))
        else:
            self._lock.release()

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

                self._lock.acquire()
                self.recv_list.append((command_type, in_message))
                self._lock.release()

                # print("Received: {}".format(in_message))
            else:
                break

    def process_incoming(self):
        while True:
            try:
                recv_data = self.sock.recv(1024)
            except OSError:
                break

            if len(recv_data) > 0:
                self.in_rw.write(recv_data)
            else:
                self._closed = True
                break

    def run(self):
        # started and waiting for connection status
        self._lock.acquire()
        self.status = 1
        self._lock.release()

        # release launcher thread
        self._sync.release()

        # create a socket (SOCK_STREAM means a TCP socket)
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        # try to connect
        while True:
            try:
                self.sock.connect((MESSENGER_HOST, MESSENGER_PORT))
                break
            except OSError:
                # ignore outgoing message
                self._lock.acquire()
                self.send_list.clear()
                self._lock.release()
                pass

            self._lock.acquire()
            status = self.status
            self._lock.release()

            # service termination asked
            if status == 3:
                break

            # try every seconds
            time.sleep(1)

        # self.sock.setblocking(False)
        self.sock.settimeout(0.1)

        # set to connected status and running
        self._lock.acquire()
        self.status = 2
        self._lock.release()

        inout = [self.sock]

        self._lock.acquire()
        while self.status == 2:
            # peer closed connection
            if self._closed:
                self.status = 1
                break

            # service termination asked
            if self.status == 3:
                break

            self._lock.release()

            infds, outfds, errfds = select.select(inout, inout, [], self.sock.gettimeout())

            if len(infds):
                self.process_incoming()

            self.process_outgoing()
            self.read_messages()

            # yeld
            # time.sleep(0)

            self._lock.acquire()

        # non connected status
        self.status = 0
        self._lock.release()

    def disconnect(self):
        if not self.sock:
            return

        self._lock.acquire()
        self.status = 3
        self._lock.release()

        if self.is_alive():
            self.join()

    def message(self, command_type, message):
        self._lock.acquire()
        # was error or non started status
        if self.status <= 0:
            self._lock.release()
            self.start()
            self._sync.acquire()
        else:
            self._lock.release()

        self._lock.acquire()
        self.send_list.append((command_type, json.dumps(message)))
        self._lock.release()

    def is_ready(self):
        return self.status == 2
