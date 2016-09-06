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

    ui: {
        table: 'table.table'
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);

        // pagination on scrolling
        $("div.panel-body").scroll($.proxy(function(e) { this.scroll(e); }, this));
    },

    onRender: function() {
        $(this.ui.table).stickyTableHeaders({scrollableArea: $('div.panel-body')});
        $("span.date").localizeDate();
    },

    scroll: function(e) {
        if (e.target.scrollHeight-e.target.clientHeight == e.target.scrollTop) {
            if (this.collection.next != null) {
                Logger.debug("fetch page " + (this.collection.next));
                this.collection.fetch({update: true, remove: false, data: {cursor: this.collection.next}});
            }
        }
    },
});

module.exports = View;
