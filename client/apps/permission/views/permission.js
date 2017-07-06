/**
 * @file permission.js
 * @brief Permission item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var PermissionModel = require('../models/permission');

var View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/permission.html'),

    ui: {
        "remove_permission": ".remove-permission",
    },

    events: {
        'click @ui.remove_permission': 'onRemovePermission',
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },
});

module.exports = View;

