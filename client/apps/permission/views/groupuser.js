/**
 * @file groupuser.js
 * @brief Permission user from group item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
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
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    removeUserFromGroup: function () {
        // can't remove himself if it is not staff or superuser
        if (session.user.username === this.model.get('username') && !(this.model.get('is_staff') || this.model.get('is_superuser')))
            return;

        this.model.destroy({wait: true});
    },

    viewUserDetails: function () {
        Backbone.history.navigate("app/permission/user/" + this.model.get('username') + '/permission/', {trigger: true});
    }
});

module.exports = View;
