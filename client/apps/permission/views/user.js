/**
 * @file user.js
 * @brief Permission user item view
 * @author Frederic SCHERMA
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionUserModel = require('../models/user');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object user',
    template: require('../templates/user.html'),

    ui: {
        enable_user: 'span.enable-user',
        disable_user: 'span.disable-user',
        set_admin: 'span.set-admin',
        set_regular: 'span.set-regular',
        viewPermissions: 'td.view-permissions',
    },

    events: {
        'click @ui.enable_user': 'enableUser',
        'click @ui.disable_user': 'disableUser',
        'click @ui.set_admin': 'setAdmin',
        'click @ui.set_regular': 'setRegular',
        'click @ui.viewPermissions': 'viewPermissions',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },

    enableUser: function () {
        // can't modify himself
        if (user.username == this.model.get('username'))
            return;

        this.model.set('is_active', true);
        this.model.save(this.model.changedAttributes(), {patch: true});
    },

    disableUser: function () {
        // can't modify himself
        if (user.username == this.model.get('username'))
            return;

        this.model.set('is_active', false);
        this.model.save(this.model.changedAttributes(), {patch: true});
    },

    setAdmin: function () {
        // can't modify himself
        if (user.username == this.model.get('username'))
            return;

        this.model.set('is_staff', true);
        this.model.save(this.model.changedAttributes(), {patch: true});
    },

    setRegular: function () {
        // can't modify himself
        if (user.username == this.model.get('username'))
            return;

        this.model.set('is_staff', false);
        this.model.save(this.model.changedAttributes(), {patch: true});
    },
    
    viewPermissions: function () {
        Backbone.history.navigate("app/permission/user/" + this.model.get('username') + "/", {trigger: true});
    }
});

module.exports = View;
