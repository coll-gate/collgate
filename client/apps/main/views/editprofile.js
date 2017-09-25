/**
 * @file editprofile.js
 * @brief Edit user profile view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    className: 'profile-edit',
    template: require('../templates/editprofile.html'),

    ui: {
        username: '#username',
        email: '#email',
        first_name: '#first_name',
        last_name: '#last_name',
        save: '#save'
    },

    events: {
        'click @ui.save': 'updateProfile'
    },

    initialize: function(options) {
        options || (options = {});
        this.model = options.model;
    },

    updateProfile: function () {
        this.model.save({
            first_name: this.ui.first_name.val(),
            last_name: this.ui.last_name.val()
        }).done(function() {
            $.alert.success(_t("Done"));
        });
    }
});

module.exports = View;
