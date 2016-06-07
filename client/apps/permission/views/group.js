/**
 * @file group.js
 * @brief Permission group item view
 * @author Frederic SCHERMA
 * @date 2016-06-02
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionGroupModel = require('../models/group');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object group',
    template: require('../templates/group.html'),

    ui: {
        delete_group: 'span.delete-group',
        view_permissions: 'td.view-permissions',
        //group_add_user: 'td.group-add-user',
    },

    events: {
        'click @ui.view_permissions': 'viewPermissions',
        'click @ui.delete_group': 'deleteGroup',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        if ($.inArray("auth.delete_group", this.model.perms) < 0) {
            $(this.ui.delete_group).remove();
        }
    },

    viewPermissions: function () {
        Backbone.history.navigate("app/permission/group/" + this.model.get('name') + "/", {trigger: true});
    }
});

module.exports = View;
