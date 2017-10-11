# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate messenger application
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import socketserver
import threading

from igdectk.common.apphelpers import ApplicationMain
from messenger.localsettings import TCP_SERVER_LISTEN_PORT, TCP_SERVER_LISTEN
from . import tcpserver


class CollGateMessengerTCPServer(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateMessengerTCPServer, self).__init__(app_name, app_module)

    def ready(self):
        super().ready()

        if self.is_run_mode():
            self.post_ready()

    def post_ready(self):
        import signal

        class GracefulInterruptHandler(object):
            def __init__(self, signals=(signal.SIGINT, signal.SIGTERM)):
                self.signals = signals
                self.original_handlers = {}

                self.interrupted = False
                self.released = False

                for sig in self.signals:
                    self.original_handlers[sig] = signal.getsignal(sig)
                    signal.signal(sig, self.handler)

            def handler(self, signum, frame):
                self.release()
                self.interrupted = True

                print("\nCTRL+C has been catched... Shutting down server...")

                if tcpserver.tcp_server:
                    tcpserver.tcp_server.shutdown()
                    tcpserver.tcp_server.server_close()
                    tcpserver.tcp_server = None

                if tcpserver.tcp_server_thread:
                    # print(tcpserver.tcp_server_thread.is_alive())
                    tcpserver.tcp_server_thread = None

                signal.pthread_kill(threading.get_ident(), signal.SIGTERM)

            def release(self):
                if self.released:
                    return False

                for sig in self.signals:
                    signal.signal(sig, self.original_handlers[sig])

                self.released = True
                return True

        handled_signals = GracefulInterruptHandler()

        # Create the server
        server = socketserver.TCPServer((TCP_SERVER_LISTEN, TCP_SERVER_LISTEN_PORT), tcpserver.TCPHandler)
        tcpserver.tcp_server = server

        tcpserver.tcp_server_thread = threading.Thread(target=server.serve_forever)

        # Exit the server thread when the main thread terminates
        tcpserver.tcp_server_thread.daemon = True
        tcpserver.tcp_server_thread.start()
