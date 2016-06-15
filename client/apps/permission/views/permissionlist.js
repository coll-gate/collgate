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
        remove_permission: 'span.remove-permission',
    },

    events: {
        'click @ui.remove_permission': 'removePermission',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
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
});

module.exports = PermissionListView;
