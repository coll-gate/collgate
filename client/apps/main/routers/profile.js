/**
 * @file profile.js
 * @brief Profile router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let EditProfileView = require('../views/editprofile');
let DefaultLayout = require('../views/defaultlayout');
let TitleView = require('../views/titleview');
let ProfileModel = require('../models/profile');

let ProfileRouter = Marionette.AppRouter.extend({
    routes : {
        "app/main/profile/logout/": "logout",
        "app/main/profile/edit/": "edit",
    },
    
    logout: function() {
        $.ajax({
            type: "POST",
            url: window.application.url(['main', 'profile', 'logout']),
            data: {},
        }).done(function(data) {
            window.open(window.application.url(), "_self", "", true);
        });
    },

    edit: function() {
        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        let model = new ProfileModel({username: window.session.user.username});

        defaultLayout.showChildView('title', new TitleView({title: _t("Edit my profile details")}));

        model.fetch().then(function() {
            defaultLayout.showChildView('content', new EditProfileView({model: model}));
        });

        //application.setDisplay('0-10-2');
    }
});

module.exports = ProfileRouter;
