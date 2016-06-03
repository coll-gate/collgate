/**
 * @file permission.js
 * @brief Permission item view
 * @author Frederic SCHERMA
 * @date 2016-05-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionModel = require('../models/permission');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    template: require('../templates/permission.html'),

    ui: {
        "remove_permission": ".remove-permission",
    },

    events: {
        'click @ui.remove_permission': 'onRemovePermission',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },
});

module.exports = View;
