/**
 * @file scrollview.js
 * @brief Base view for scrollable view with a cursor collection
 * @author Frederic SCHERMA
 * @date 2016-10-07
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.CompositeView.extend({
    rowHeight: 1+8+20+8,
    scrollViewInitialized: false,

    ui: {
        table: 'table.table',
        header: 'table.table thead'
    },

    initialize: function() {
    },

    onDomRefresh: function() {
        // we can only init here because we need to known the parent container
        if (!this.scrollViewInitialized) {
            // pagination on scrolling using the direct parent as scroll container
            $(this.$el.parent()).scroll($.proxy(function (e) { this.scroll(e); }, this));
            // and sticky header on table
            $(this.ui.table).stickyTableHeaders({scrollableArea: this.$el.parent()});

            this.scrollViewInitialized = true;
        }
    },

    capacity: function() {
        return Math.max(1, Math.floor(this.$el.parent().prop('clientHeight') / this.rowHeight) - 1);
    },

    moreResults: function(more, scroll) {
        scroll || (scroll=false);
        more || (more=20);

        var view = this;

        if (more == -1) {
            more = this.capacity();
        }

        if (this.collection.next != null) {
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
                    scrollEl.scrollTop(height - clientHeight - view.rowHeight);
                }
            });
        }
    },

    scroll: function(e) {
        if (e.target.scrollTop > 1) {
            $(this.ui.table).children('thead').addClass("sticky");
        } else{
            $(this.ui.table).children('thead').removeClass("sticky");
        }

        if (e.target.scrollHeight-e.target.clientHeight == e.target.scrollTop) {
            this.moreResults();
        }
    },
});

module.exports = View;
