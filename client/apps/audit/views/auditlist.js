/**
 * @file auditlist.js
 * @brief Audit list view
 * @author Frederic SCHERMA
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var AuditView = require('../views/audit');

var View = Marionette.CompositeView.extend({
    template: require("../templates/auditlist.html"),
    childView: AuditView,
    childViewContainer: 'tbody.audit-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
    },

    onRender: function() {
    },
});

module.exports = View;
