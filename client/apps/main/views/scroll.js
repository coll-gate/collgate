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
    selectedColumns: [],

    attributes: {
    },

    ui: {
        table: 'table.table',
        header: 'table.table thead'
    },

    events: {
    },

    constructor: function() {
        var prototype = this.constructor.prototype;

        this.events = {};
        this.defaultOptions = {};
        this.ui = {};
        this.attributes = {};
        this.className = "";

        while (prototype) {
            if (prototype.hasOwnProperty("events")) {
                _.defaults(this.events, prototype.events);
            }
            if (prototype.hasOwnProperty("defaultOptions")) {
                _.defaults(this.defaultOptions, prototype.defaultOptions);
            }
            if (prototype.hasOwnProperty("ui")) {
                _.defaults(this.ui, prototype.ui);
            }
            if (prototype.hasOwnProperty("attributes")) {
                _.defaults(this.attributes, prototype.attributes);
            }
            if (prototype.hasOwnProperty("className")) {
                this.className += " " + prototype.className;
            }
            prototype = prototype.constructor.__super__;
        }

        Marionette.CompositeView.apply(this, arguments);
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        options || (options = {columns: {}});

        this.listenTo(this.collection, 'reset', this.onResetCollection, this);
        this.listenTo(this.collection, 'sync', this.onCollectionSync, this);

        // process columns
        this.displayedColumns = [];

        for (var i = 0; i < this.selectedColumns.length; ++i) {
            var columnName = this.selectedColumns[i].name;
            if (options.columns[columnName]) {
                this.displayedColumns.push({
                    name: columnName,
                    label: options.columns[columnName].label,
                    query: options.columns[columnName].query || false
                });
            }
        }
    },

    onResetCollection: function() {
        this.lastModels = null;

        // reset scrolling
        var scrollEl = this.$el.parent();
        scrollEl.scrollTop(0);
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

        if (more === -1) {
            more = this.capacity();
        }

        if ((this.collection !== null) && (this.collection.next !== null)) {
            this.collection.fetch({update: true, remove: false, data: {
                cursor: this.collection.next,
                sort_by: this.collection.sort_by,
                more: more
            }}).done(function(data) {
                // re-sync the sticky table header during scrolling after collection was rendered
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

    onRefreshChildren: function() {
        /* nothing by default */
    },

    onRenderCollection: function() {
        // post refresh on children once every children was rendered for the first rendering
        this.onRefreshChildren();
    },

    onCollectionSync: function (collection, data) {
        // keep list of last queried models, done just once the collection get synced
        this.lastModels = [];
        for (var i = 0; i < data.items.length; ++i) {
            this.lastModels.push(this.collection.get(data.items[i].id));
        }

        // post refresh on children once every children was rendered for any other rendering
        this.onRefreshChildren();
    },

    scroll: function(e) {
        if (e.target.scrollTop > 1) {
            this.ui.table.children('thead').addClass("sticky");
        } else{
            this.ui.table.children('thead').removeClass("sticky");
        }

        if (e.target.scrollHeight-e.target.clientHeight === e.target.scrollTop) {
            this.moreResults();
        }
    },

    getLastModels: function() {
        if (this.lastModels == undefined) {
            this.lastModels = [];
            for (var i = 0; i < this.collection.models.length; ++i) {
                this.lastModels.push(this.collection.models[i]);
            }
        }

        return this.lastModels;
    }
});

module.exports = View;
