/**
 * @file group.js
 * @brief Permission group item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-02
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object group',
    template: require('../templates/group.html'),

    ui: {
        delete_group: 'span.delete-group',
        change_name: 'td.change-name',
        view_permissions: 'td.view-permissions',
        view_users: 'td.view-users'
    },

    events: {
        'click @ui.delete_group': 'deleteGroup',
        'click @ui.change_name': 'onRenameGroup',
        'click @ui.view_permissions': 'viewPermissions',
        'click @ui.view_users': 'viewUsers'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, title: gt.gettext("Manage permissions"), event: 'viewPermissions'},
                tag: {display: true, title: gt.gettext("Edit label"), event: 'onRenameGroup'},
                manage: {display: true, title: gt.gettext("Manage users"), event: 'viewUsers'},
                remove: {display: true, event: 'deleteGroup'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        if ($.inArray("auth.delete_group", this.model.perms) < 0) {
            $(this.ui.delete_group).remove();
        }
    },

    viewPermissions: function () {
        Backbone.history.navigate("app/permission/group/" + this.model.get('id') + "/permission/", {trigger: true});
    },

    viewUsers: function () {
        Backbone.history.navigate("app/permission/group/" + this.model.get('id') + "/user/", {trigger: true});
    },

    deleteGroup: function () {
        this.model.destroy({wait: true});
    },

    onRenameGroup: function() {
        var ChangeName = require('../../main/views/entityrename');
        var changeName = new ChangeName({
            model: this.model,
            title: gt.gettext("Rename the group of users")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    }
});

module.exports = View;
