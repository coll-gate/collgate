/**
 * @file addpermissiontype.js
 * @brief Add permission type to a user, item view
 * @author Frederic SCHERMA
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    template: require('../templates/addpermissiontype.html'),

    ui: {
        add_permission: ".add-permission",
        permissions_types: ".permissions-types",
    },

    events: {
        'click @ui.add_permission': 'onAddPermission',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        ohgr.permission.views.permissionType.drawSelect(this.ui.permissions_types);
    },
});

module.exports = View;
