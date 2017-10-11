/**
 * @file messenger.js
 * @brief WebSocket connector to messenger service
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-10-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Messenger = function(host, port, path) {
    this.host = host || window.location.hostname;
    this.port = port || 8002;
    this.path = path || (application.baseUrl + 'messenger/');
    this.socket = null;

    this.COMMAND_CACHE_INVALIDATION = 1;
    this.RETRY_DELAY = 5000;
    this.CONNECT_DELAY = 500;
};

/**
 * Connect to the service.
 */
Messenger.prototype.connect = function() {
    var self = this;

    if (this.socket) {
        return;
    }

    // obtain the messengerid
    $.ajax({
        type: "GET",
        url: application.baseUrl + 'messenger/messengerid/',
        dataType: 'json'
    }).done(function(data) {
        self.messengerid = data.messengerid;

        // deferred to 0.5sec
        setTimeout(function(self) {
            self.messengerid = data.messengerid;

            var parameters = '?username=' + session.user.username + '&messengerid=' + encodeURIComponent(data.messengerid);
            try {
                self.socket = new WebSocket("ws://" + self.host + ":" + self.port + self.path + parameters);
            } catch (e) {
               // disable cache persistence
                application.main.cache.disable();

                setTimeout(function (self) {
                    self.connect();
                }, self.RETRY_DELAY, self);
            }

            self.socket.onmessage = function (e) {
                var data = JSON.parse(e.data);

                if (data.command === self.COMMAND_CACHE_INVALIDATION) {
                    application.main.cache.invalidate(data.data.category, data.data.name);
                }
            };

            self.socket.onclose = function () {
                self.socket = null;

                // disable cache persistence
                application.main.cache.disable();

                setTimeout(function (self) {
                    self.connect();
                }, self.RETRY_DELAY, self);
            };

            self.socket.onopen = function () {
                // enable cache persistence
                application.main.cache.enable();

                session.logger.info(_t("Connected to messenger"));
            };

            // Call onopen directly if socket is already open
            if (self.socket.readyState === WebSocket.OPEN) {
                self.socket.onopen();
            }
        }, self.CONNECT_DELAY, self);
    }).fail(function() {
        $.alert(_t("Unable to get a messenger identifier"));

        setTimeout(function(self) {
            self.connect();
        }, self.RETRY_DELAY, self);
    });
};

Messenger.prototype.disconnect = function() {
    if (this.socket) {
        delete this.socket;
        this.socket = null;
    }
};

Messenger.prototype.message = function(data) {
    if (!this.socket) {
        return;
    }

    this.socket.send(JSON.stringify(data));
};

module.exports = Messenger;
