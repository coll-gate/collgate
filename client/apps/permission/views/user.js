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
        set_user: 'span.set-user',
        set_superuser: 'span.set-superuser',
        set_regular: 'span.set-regular',
        set_staff: 'span.set-staff',
        viewPermissions: 'td.view-permissions',
    },

    events: {
        'click @ui.enable_user': 'enableUser',
        'click @ui.disable_user': 'disableUser',
        'click @ui.set_regular': 'setRegular',
        'click @ui.set_staff': 'setStaff',
        'click @ui.set_user': 'setUser',
        'click @ui.set_superuser': 'setSuperUser',
        'click @ui.viewPermissions': 'viewPermissions',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },

    enableUser: function () {
        // can't modify himself
        if (session.user.username == this.model.get('username'))
            return;

        this.model.save({is_active: true}, {patch: true, wait: true});
    },

    disableUser: function () {
        // can't modify himself
        if (session.user.username == this.model.get('username'))
            return;

        // this.model.set('is_active', false);
        // this.model.save(this.model.changedAttributes(), {patch: true});
        this.model.save({is_active: false}, {patch: true, wait: true});
    },

    setStaff: function () {
        // can't modify himself
        if (session.user.username == this.model.get('username'))
            return;

        this.model.save({is_staff: true}, {patch: true, wait: true});
    },

    setRegular: function () {
        // can't modify himself
        if (session.user.username == this.model.get('username'))
            return;

        this.model.save({is_staff: false}, {patch: true, wait: true});
    },

    setSuperUser: function () {
        // can't modify himself
        if (session.user.username == this.model.get('username'))
            return;

        this.model.save({is_superuser: true}, {patch: true, wait: true});
    },

    setUser: function () {
        // can't modify himself
        if (session.user.username == this.model.get('username'))
            return;

        this.model.save({is_superuser: false}, {patch: true, wait: true});
    },

    viewPermissions: function () {
        Backbone.history.navigate("app/permission/user/" + this.model.get('username') + "/permission/", {trigger: true});
    }
});

module.exports = View;
