/**
 * @file descriptorvaluepairlist.js
 * @brief List of pair values for a type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-08-01
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorValueModel = require('../models/descriptorvalue');
var DescriptorValuePairView = require('../views/descriptorvaluepair');

var View = Marionette.CompositeView.extend({
    template: require("../templates/descriptorvaluepairlist.html"),
    childView: DescriptorValuePairView,
    childViewContainer: 'tbody.descriptor-value-list',

    templateHelpers: function() {
        return {
            format: this.collection.format,
            items: this.collection.toJSON()
        };
    },
    childViewOptions: function () {
        return {
            can_delete: this.model.get('can_delete'),
            can_modify: this.model.get('can_modify')
        }
    },

    ui: {
        table: "table.descriptor-table",
        sort_by_id: "th span.action.column-sort-id",
        sort_by_value0: "th span.action.column-sort-value0",
        sort_by_value1: "th span.action.column-sort-value1"
    },

    events: {
        'click @ui.sort_by_id': 'sortColumn',
        'click @ui.sort_by_value0': 'sortColumn',
        'click @ui.sort_by_value1': 'sortColumn',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);

        // pagination on scrolling (done here because on once, and auto off when view destroy)
        $("div.panel-body").scroll($.proxy(function(e) { this.scroll(e); }, this));
    },

    onUpdate: function() {
        alert();
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
        //$(this.ui.table).stickyTableHeaders({scrollableArea: this.$el.parent()});
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
