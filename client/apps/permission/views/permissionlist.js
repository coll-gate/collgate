/**
 * @file permissionlist.js
 * @brief Permission list view
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionModel = require('../models/permission');
var PermissionView = require('../views/permission');

var PermissionListView = Marionette.CompositeView.extend({
    template: require("../templates/permissionlist.html"),
    childViewContainer: ".permission-list",
    childView: PermissionView,

    ui: {
        permission_add: ".permission-add",
        add_permission: ".add-permission",
        permissions_types: ".permissions-types",
        remove_permission: 'span.remove-permission',
    },

    events: {
        'click @ui.add_permission': 'addPermission',
        'click @ui.remove_permission': 'removePermission',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'add', this.updatePermissionSelect, this);
        this.listenTo(this.collection, 'remove', this.updatePermissionSelect, this);
        this.listenTo(this.collection, 'change', this.render, this);
    },

    onRender: function() {
        if ($.inArray("auth.add_permission", this.collection.perms) < 0) {
            $(this.ui.permission_add).remove();
        }
    },

    updatePermissionSelect: function () {
        ohgr.permission.views.permissionType.drawSelect(this.ui.permissions_types);

        // remove defined permissions
        var select = this.ui.permissions_types;

        for (var i = 0; i < this.collection.size(); ++i) {
            var model = this.collection.at(i);
            for (var j = 0; j < model.get('permissions').length; ++j) {
                var permission = model.get('permissions')[j];
                select.find('option[value="' + permission.app_label + "." + model.get('model') + "." + permission.id + '"]').remove();
            }
        }

        $(this.ui.permissions_types).selectpicker('refresh');
    },

    onDomRefresh: function () {
        this.updatePermissionSelect();
    },

    removePermission: function (e) {
        var appLabel = e.target.getAttribute("app_label");
        var codename = e.target.getAttribute("codename");
        var modelName = e.target.getAttribute("model");
        var object = e.target.getAttribute("object");

        var model = null;
        if (object.length > 0)
            model = this.collection.findWhere({model: modelName, object: object});
        else
            model = this.collection.findWhere({model: modelName});

        if (model == null)
            return;

         $.ajax({
             type: "PATCH",
             url: this.collection.url(),
             dataType: 'json',
             contentType: "application/json; charset=utf-8",
             collection: this.collection,
             model: model,
             data: JSON.stringify({
                 action: "remove",
                 target: "permission",
                 content_type: appLabel + '.' + modelName,
                 permission: codename
             })
        }).done(function(data) {
            this.collection.fetch();
        });
    },

    addPermission: function () {
        var permission = $(this.ui.permissions_types).val().split('.');

        $.ajax({
            type: "POST",
            url: this.collection.url(),
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            collection: this.collection,
            data: JSON.stringify({
                content_type: permission[0] + '.' + permission[1],
                permission: permission[2]
            })
        }).done(function(data) {
            this.collection.fetch();
        });
    },
});

module.exports = PermissionListView;
