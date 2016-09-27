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
    },

    onDomRefresh: function() {
        // init/reinit sticky table header
        $(this.ui.table).stickyTableHeaders({scrollableArea: this.$el.parent()});
    },

    capacity: function() {
        var rowHeight = 1+8+20+8;
        return Math.max(1, Math.floor(this.$el.parent().prop('clientHeight') / rowHeight) - 1);
    },

    moreResults: function(more, scroll) {
        scroll || (scroll=false);
        more || (more=20);

        var view = this;

        if (more == -1) {
            more = this.capacity();
        }

        if (this.collection.next != null) {
            Logger.debug("audit::fetch next with cursor=" + (this.collection.next));
            this.collection.fetch({update: true, remove: false, data: {
                cursor: this.collection.next,
                sort_by: this.collection.sort_by,
                more: more
            }}).done(function() {
                // resync the sticky table header during scrolling
                $(view.ui.table).stickyTableHeaders({scrollableArea: view.$el.parent()});

                if (scroll) {
                    var scrollEl = view.$el.parent();

                    var height = scrollEl.prop('scrollHeight');
                    var clientHeight = scrollEl.prop('clientHeight');
                    scrollEl.scrollTop(height - clientHeight - (1+8+20+8));
                }
            });
        }

        // resync the sticky table header during scrolling
        $(this.ui.table).stickyTableHeaders({scrollableArea: this.$el.parent()});
    },

    scroll: function(e) {
        if (e.target.scrollHeight-e.target.clientHeight == e.target.scrollTop) {
            this.moreResults();
        }
    },
});

module.exports = View;
