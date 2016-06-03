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
        viewPermissions: 'td.view-permissions',
    },

    events: {
        'click @ui.viewPermissions': 'viewPermissions',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },

    viewPermissions: function () {
        Backbone.history.navigate("app/permission/group/" + this.model.get('name') + "/", {trigger: true});
    }
});

module.exports = View;
