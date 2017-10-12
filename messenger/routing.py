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
from messenger.consumers import ws_message, ws_connect, ws_disconnect, ws_connect_null

channel_routing = [
    # /coll-gate/messenger/
    route("websocket.connect", ws_connect, path=r'^/coll-gate/messenger/$'),
    route("websocket.receive", ws_message, path=r'^/coll-gate/messenger/$'),
    route("websocket.disconnect", ws_disconnect, path=r'^/coll-gate/messenger/$'),

    # reject any others paths
    route("websocket.connect", ws_connect_null, path=r'^.*$'),

    # HTTP
    # route("http.request", "consumers.http_consumer"),
]
