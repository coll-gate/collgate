/**
 * @file audit.js
 * @brief Audit router
 * @author Frederic SCHERMA
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var AuditCollection = require('../collections/audit');
var AuditListView = require('../views/auditlist');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var Router = Marionette.AppRouter.extend({
    controller: application.audit.controllers.audit,
    appRoutes : {
        "app/audit/search/?username=:username": "getAuditListByUsername",
        "app/audit/search/?app_label=:app_label&model=:model&object_id=:object_id": "getAuditListByEntity",
    },

    // getAuditListByUsername: function(username) {
    //     var controller = new AuditController();
    //     controller.getAuditListByUsername(username);
    // },
    //
    // getAuditListByEntity: function(app_label, model, object_id) {
    //     var controller = new AuditController();
    //     controller.getAuditListByEntity(app_label, model, object_id);
    // }
});

module.exports = Router;
