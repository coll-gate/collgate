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
};

/**
 * Connect to the service.
 */
Messenger.prototype.connect = function() {
    if (this.socket) {
        return;
    }

    var self = this;

    // obtain the messengerid
    $.ajax({
        type: "GET",
        url: application.baseUrl + 'messenger/messengerid/',
        dataType: 'json'
    }).done(function(data) {
        self.messengerid = data.messengerid;

        var parameters = '?username=' + session.user.username + '&messengerid=' + encodeURIComponent(data.messengerid);
        self.socket = new WebSocket("ws://" + self.host + ":" + self.port + self.path + parameters);

        self.socket.onmessage = function (e) {
            var data = JSON.parse(e.data);
            console.log(data);
        };

        self.socket.onopen = function () {
            session.logger.info(_t("Connected to messenger"));
        };

        // Call onopen directly if socket is already open
        if (self.socket.readyState === WebSocket.OPEN) {
            self.socket.onopen();
        }
    }).fail(function() {
        $.alert(_t("Unable to get a messenger identifier"));
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
