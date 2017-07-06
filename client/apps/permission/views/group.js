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
var Dialog = require('../../main/views/dialog');

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

    onRenameGroup: function(e) {
        var ChangeName = Dialog.extend({
            template: require('../templates/grouprename.html'),

            attributes: {
                id: "dlg_change_name"
            },

            ui: {
                name: "#group_name"
            },

            events: {
                'input @ui.name': 'onNameInput'
            },

            initialize: function (options) {
                ChangeName.__super__.initialize.apply(this);
            },

            onNameInput: function () {
                this.validateName();
            },

            validateName: function() {
                var v = this.ui.name.val();
                var re = /^[a-zA-Z0-9_\-]+$/i;

                if (v.length > 0 && !re.test(v)) {
                    $(this.ui.name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
                    return false;
                } else if (v.length < 3) {
                    $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
                    return false;
                }

                $(this.ui.name).validateField('ok');

                return true;
            },

            onApply: function() {
                var name = this.ui.name.val();
                var model = this.getOption('model');

                if (this.validateName()) {
                    model.save({name: name}, {patch: true, wait:true, success: function() {
                        $.alert.success('Done');
                    }});
                    this.destroy();
                }
            },
        });

        var changeName = new ChangeName({
            model: this.model
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));
    }
});

module.exports = View;
