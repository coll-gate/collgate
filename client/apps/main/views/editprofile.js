/**
 * @file editprofile.js
 * @brief Edit user profile view
 * @author Frederic SCHERMA
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
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
        //this.model.save();
    }
});

module.exports = View;
