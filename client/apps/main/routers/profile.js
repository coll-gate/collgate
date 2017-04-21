/**
 * @file profile.js
 * @brief Profile router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var EditProfileView = require('../views/editprofile');
var DefaultLayout = require('../views/defaultlayout');
var TitleView = require('../views/titleview');
var ProfileModel = require('../models/profile');

var ProfileRouter = Marionette.AppRouter.extend({
    routes : {
        "app/main/profile/logout/": "logout",
        "app/main/profile/edit/": "edit",
    },
    
    logout: function() {
        $.ajax({
            type: "POST",
            url: application.baseUrl + "main/profile/logout/",
            data: {},
        }).done(function(data) {
            window.open(application.baseUrl, "_self", "", true);
        });
    },

    edit: function() {
        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        model = new ProfileModel({username: session.user.username});

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Edit my profile informations")}));

        model.fetch().done(function() {
            defaultLayout.getRegion('content').show(new EditProfileView({model: model}));
        });

        //application.setDisplay('0-10-2');
    }
});

module.exports = ProfileRouter;

