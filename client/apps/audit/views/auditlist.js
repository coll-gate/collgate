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
    childViewContainer: 'div.audit-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);

        this.page = 1;

        // pagination on scrolling
        $("div.panel-body").scroll($.proxy(function(e) { this.scroll(e); }, this));
    },

    onRender: function() {
        $("span.date").localizeDate();
    },

    scroll: function(e) {
        if (e.target.scrollHeight-e.target.clientHeight == e.target.scrollTop) {
            if (this.collection.size() < this.collection.total_count) {
                Logger.debug("fetch page " + (this.page+1) + " for " + this.collection.total_count + " items");
                this.collection.fetch({update: true, remove: false, data: {page: ++this.page}});
            }
        }
    },
});

module.exports = View;
