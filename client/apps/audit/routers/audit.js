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

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/audit/": "getAudit",
    },

    getAudit: function () {
        var auditCollection = new AuditCollection([], {data: {page: 1}, processData: true});

        var defaultLayout = new DefaultLayout({});
        application.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of audit entries by date")}));

        auditCollection.fetch().then(function () {
            defaultLayout.content.show(new AuditListView({collection : auditCollection}));
        });
    },
});

module.exports = Router;
