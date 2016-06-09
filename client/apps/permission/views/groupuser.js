/**
 * @file groupuser.js
 * @brief Permission user from group item view
 * @author Frederic SCHERMA
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionGroupUserModel = require('../models/groupuser');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object user',
    template: require('../templates/groupuser.html'),

    ui: {
        remove_user: 'span.remove-user',
        view_user: 'td.view-user',
    },

    events: {
        'click @ui.remove_user': 'removeUserFromGroup',
        'click @ui.view_user': 'viewUserDetails',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },

    removeUserFromGroup: function () {
        // can't remove himself
        /*if (user.username == this.model.get('username'))
            return;

        this.model.save({is_superuser: false}, {patch: true, wait: true});*/
        this.model.destroy();
    },

    viewUserDetails: function () {
        Backbone.history.navigate("app/permission/user/" + this.model.get('username'), {trigger: true});
    }
});

module.exports = View;
