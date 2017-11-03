/**
 * @file addpermission.js
 * @brief Add a permission to a collection view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
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
        let select = this.ui.permissions_types;

        for (let i = 0; i < this.collection.size(); ++i) {
            let model = this.collection.at(i);
            for (let j = 0; j < model.get('permissions').length; ++j) {
                let permission = model.get('permissions')[j];
                select.find('option[value="' + permission.app_label + "." + model.get('model') + "." + permission.id + '"]').remove();
            }
        }

        $(select).select2();
    },

    onDomRefresh: function () {
        this.updatePermissionSelect();
    },

    addPermission: function () {
        let permission = $(this.ui.permissions_types).val().split('.');

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
