/**
 * @file addpermission.js
 * @brief Add a permission to a collection view
 * @author Frederic SCHERMA
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'permission-add',
    template: require('../templates/addpermission.html'),

    ui: {
        add_permission: ".add-permission",
        permissions_types: "select.permissions-types",
    },

    events: {
        'click @ui.add_permission': 'addPermission',
    },

    initialize: function(options) {
        options || (options = {});

        this.collection = options.collection;

        this.listenTo(this.collection, 'add', this.updatePermissionSelect, this);
        this.listenTo(this.collection, 'remove', this.updatePermissionSelect, this);
    },

    updatePermissionSelect: function () {
        application.permission.views.permissionType.drawSelect(this.ui.permissions_types, false);

        // remove defined permissions
        var select = this.ui.permissions_types;

        for (var i = 0; i < this.collection.size(); ++i) {
            var model = this.collection.at(i);
            for (var j = 0; j < model.get('permissions').length; ++j) {
                var permission = model.get('permissions')[j];
                select.find('option[value="' + permission.app_label + "." + model.get('model') + "." + permission.id + '"]').remove();
            }
        }

        $(select).select2();
    },

    onDomRefresh: function () {
        this.updatePermissionSelect();
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

module.exports = View;
