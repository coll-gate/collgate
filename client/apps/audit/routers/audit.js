/**
 * @file audit.js
 * @brief Audit router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let AuditCollection = require('../collections/audit');
let AuditListView = require('../views/auditlist');
let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let Router = Marionette.AppRouter.extend({
    controller: application.audit.controllers.audit,
    appRoutes : {
        "app/audit/search/?username=:username": "getAuditListByUsername",
        "app/audit/search/?app_label=:app_label&model=:model&object_id=:object_id": "getAuditListByEntity",
    },

    // getAuditListByUsername: function(username) {
    //     let controller = new AuditController();
    //     controller.getAuditListByUsername(username);
    // },
    //
    // getAuditListByEntity: function(app_label, model, object_id) {
    //     let controller = new AuditController();
    //     controller.getAuditListByEntity(app_label, model, object_id);
    // }
});

module.exports = Router;

