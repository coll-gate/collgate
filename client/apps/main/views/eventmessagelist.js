/**
 * @file eventmessagelist.js
 * @brief Event message list collection view.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let EventMessageView = require('./eventmessage');

let View = Marionette.CollectionView.extend({
    className: "event-message-list",
    childView: EventMessageView
});

module.exports = View;

