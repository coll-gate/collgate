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

var ProfileRouter = Marionette.AppRouter.extend({
    routes : {
        "app/profile/logout/": "logout",
        "app/profile/edit/": "edit",
    },
    logout : function() {
        $.ajax({
            type: "POST",
            url: ohgr.baseUrl + "profile/logout/",
            //dataType: 'json',
            data: {},
        }).done(function(data) {
            window.open(ohgr.baseUrl, "_self", [], true);
        });
    },
    edit : function() {
        alert("edit : do it");
    }
});

module.exports = ProfileRouter;
