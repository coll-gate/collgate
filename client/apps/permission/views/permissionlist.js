/**
 * @file permissionlist.js
 * @brief Permission list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let PermissionModel = require('../models/permission');
let PermissionView = require('../views/permission');

let PermissionListView = Marionette.CompositeView.extend({
    template: require("../templates/permissionlist.html"),
    childViewContainer: ".permission-list",
    childView: PermissionView,

    ui: {
        remove_permission: 'span.remove-permission',
    },

    events: {
        'click @ui.remove_permission': 'removePermission',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
    },

    removePermission: function (e) {
        let appLabel = e.target.getAttribute("app_label");
        let codename = e.target.getAttribute("codename");
        let modelName = e.target.getAttribute("model");
        let object = e.target.getAttribute("object");

        let model = null;
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
});

module.exports = PermissionListView;

