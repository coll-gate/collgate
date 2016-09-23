/**
 * @file descriptorvaluelist.js
 * @brief List of values for a type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorValueModel = require('../models/descriptorvalue');
var DescriptorValueView = require('../views/descriptorvalue');

var View = Marionette.CompositeView.extend({
    template: require("../templates/descriptorvaluelist.html"),
    childView: DescriptorValueView,
    childViewContainer: 'tbody.descriptor-value-list',

    ui: {
        table: "table.descriptor-table",
        sort_by_id: "th span.action.column-sort-id",
        sort_by_value0: "th span.action.column-sort-value0"
    },

    events: {
        'click @ui.sort_by_id': 'sortColumn',
        'click @ui.sort_by_value0': 'sortColumn',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);

        // pagination on scrolling
        //$("div.panel-body").scroll($.proxy(function(e) { this.scroll(e); }, this));
        this.$el.scroll($.proxy(function(e) { this.scroll(e); }, this));
    },

    onRender: function() {
        var sort_by = /([+\-]{0,1})([a-z0-9]+)/.exec(this.collection.sort_by);
        var sort_el = this.$el.find('span[column-name="' + sort_by[2] + '"]');

        if (sort_by[1] === '-') {
            if ((sort_el.attr('column-type') || "alpha") === "numeric") {
                sort_el.addClass('glyphicon-sort-by-order-alt');
            } else {
                sort_el.addClass('glyphicon-sort-by-alphabet-alt');
            }
            sort_el.data('sort', 'desc');
        } else {
            if ((sort_el.attr('column-type') || "alpha") === "numeric") {
                sort_el.addClass('glyphicon-sort-by-order');
            } else {
                sort_el.addClass('glyphicon-sort-by-alphabet');
            }
            sort_el.data('sort', 'asc');
        }

        // reset scrolling
        this.$el.parent().scrollTop(0);
    },

    onDomRefresh: function() {
        // init/reinit sticky table header
        $(this.ui.table).stickyTableHeaders({scrollableArea: this.$el.parent()});
    },

    scroll: function(e) {
        var view = this;

        if (e.target.scrollHeight-e.target.clientHeight == e.target.scrollTop) {
            if (this.collection.next != null) {
                Logger.debug("descriptorTypeValue::fetch next with cursor=" + (this.collection.next));
                this.collection.fetch({update: true, remove: false, data: {
                    cursor: this.collection.next, sort_by: this.collection.sort_by}}).done(function() {
                        // resync the sticky table header during scrolling
                        $(view.ui.table).stickyTableHeaders({scrollableArea: view.$el.parent()});
                });
            }
        }

        // resync the sticky table header during scrolling
        $(this.ui.table).stickyTableHeaders({scrollableArea: this.$el.parent()});
    },

    sortColumn: function (e) {
        var column = $(e.target).attr('column-name') || "id";
        var order = $(e.target).data('sort') || "none";

        if (order === "asc") {
            sort_by = "-" + column;
        } else {
            sort_by = "+" + column;
        }

        this.collection.next = null;
        this.collection.fetch({reset: true, update: false, remove: true, data: {cursor: null, sort_by: sort_by}});
    }
});

module.exports = View;
