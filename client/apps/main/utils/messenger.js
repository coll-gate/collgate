/**
 * @file messenger.js
 * @brief WebSocket connector to messenger service
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-10-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Messenger = function() {
    this.host = window.location.hostname;
    this.port = 8002;
    this.path = window.application.url('messenger');
    this.socket = null;
    this.attempt = 0;

    this.RETRY_DELAY = 5000;
    this.CONNECT_DELAY = 500;
    this.MAX_ATTEMPTS = 10;

    this.COMMAND_CACHE_INVALIDATION = 1;
};

/**
 * Connect to the service.
 */
Messenger.prototype.connect = function(force) {
    force || (force = false);

    let self = this;

    if (this.socket) {
        return;
    }

    if (force) {
        self.attempt = 0;
    }

    ++self.attempt;

    if (self.attempt > self.MAX_ATTEMPTS) {
        return;
    }

    let retry = function(self) {
        // disable cache persistence
        window.application.main.cache.disable();

        setTimeout(function (self) {
            self.connect();
        }, self.RETRY_DELAY * self.attempt, self);
    };

    // obtain the messengerid
    $.ajax({
        type: "GET",
        url: window.application.url(['messenger', 'messengerid']),
        dataType: 'json'
    }).done(function(data) {
        if (!data.alive) {
            return retry(self);
        }

        // deferred to 0.5sec
        setTimeout(function(self, connection) {
            let url = window.application.makeUrl(
                "ws://", connection.host, connection.port, connection.path.split('/'), {
                    username: window.session.user.username,
                    messengerid: connection.messengerid
            });

            try {
                self.socket = new WebSocket(url);
            } catch (e) {
                return retry(self);
            }

            self.socket.onmessage = function (e) {
                let data = JSON.parse(e.data);

                if (data.command === self.COMMAND_CACHE_INVALIDATION) {
                    window.application.main.cache.invalidate(data.data.category, data.data.name);
                }
            };

            self.socket.onclose = function () {
                self.socket = null;
                return retry(self);
            };

            self.socket.onopen = function () {
                self.attempt = 0;
                self.messengerid = connection.messengerid;
                self.host = connection.host;
                self.port = connection.port;
                self.path = window.application.url(connection.path);

                // enable cache persistence
                window.application.main.cache.enable();

                window.session.logger.info(_t("Connected to messenger"));
            };

            // Call onopen directly if socket is already open
            if (self.socket.readyState === WebSocket.OPEN) {
                self.socket.onopen();
            }
        }, self.CONNECT_DELAY, self, data);
    }).fail(function() {
        $.alert(_t("Unable to get a messenger identifier"));

        return retry(self);
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
