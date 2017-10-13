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
        username: 'input[name=username]',
        email: 'input[name=email]',
        first_name: 'input[name=first_name]',
        last_name: 'input[name=last_name]',
        save: 'button[name=save]'
    },

    events: {
        'click @ui.save': 'updateProfile'
    },

    initialize: function(options) {
        options || (options = {});

        View.__super__.initialize.apply(this, arguments);
    },

    onRender: function() {
    },

    updateProfile: function () {
        let model = this.model;

        this.model.save({
            first_name: this.ui.first_name.val(),
            last_name: this.ui.last_name.val()
        }).done(function() {
            let text = model.get('first_name') && model.get('last_name') ? model.get('first_name') + ' ' + model.get('last_name') : model.get('username');
            $('#drop-profile span[name=label]').text(text);

            $.alert.success(_t("Done"));
        });
    }
});

module.exports = View;
