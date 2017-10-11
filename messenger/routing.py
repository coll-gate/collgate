# -*- coding: utf-8; -*-
#
# @file base.py
# @brief
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from channels.routing import route
from messenger.consumers import ws_message, ws_connect, ws_disconnect

channel_routing = [
    route("websocket.connect", ws_connect, path=r'^/coll-gate/messenger/$'),
    route("websocket.receive", ws_message, path=r'^/coll-gate/messenger/$'),
    route("websocket.disconnect", ws_disconnect, path=r'^/coll-gate/messenger/$'),
    # route("http.request", "consumers.http_consumer"),
]
