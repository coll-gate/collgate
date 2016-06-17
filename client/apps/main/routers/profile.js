/**
 * @file profile.js
 * @brief Profile router
 * @author Frederic SCHERMA
 * @date 2016-04-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var EditProfileView = require('../views/editprofile');
var DefaultLayout = require('../views/defaultlayout');
var TitleView = require('../views/titleview');

var ProfileRouter = Marionette.AppRouter.extend({
    routes : {
        "app/profile/logout/": "logout",
        "app/profile/edit/": "edit",
    },
    
    logout : function() {
        $.ajax({
            type: "POST",
            url: ohgr.baseUrl + "profile/logout/",
            data: {},
        }).done(function(data) {
            window.open(ohgr.baseUrl, "_self", "", true);
        });
    },

    edit : function() {
        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("Edit my profile informations")}));
        defaultLayout.content.show(new EditProfileView());

        //ohgr.setDisplay('0-10-2');
    }
});

module.exports = ProfileRouter;
