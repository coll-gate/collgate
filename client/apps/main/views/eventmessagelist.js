/**
 * @file eventmessagelist.js
 * @brief Event message list collection view.
 * @author Frederic SCHERMA
 * @date 2017-02-02
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var EventMessageView = require('./eventmessage');

var View = Marionette.CollectionView.extend({
    className: "event-message-list",
    childView: EventMessageView
});

module.exports = View;
