/**
 * @file descriptorvalueordinallist.js
 * @brief List of ordinam values for a type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-10-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorValueModel = require('../models/descriptorvalue');
var DescriptorValueOrdinalView = require('../views/descriptorvalueordinal');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/descriptorvalueordinallist.html"),
    className: "object descriptor-value-list advanced-table-container",
    childView: DescriptorValueOrdinalView,
    childViewContainer: 'tbody.descriptor-value-list',

    templateHelpers/*templateContext*/: function() {
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
        sort_by_ordinal: "th span.action.column-sort-ordinal",
        sort_by_value0: "th span.action.column-sort-value0"
    },

    events: {
        'click @ui.sort_by_id': 'sortColumn',
        'click @ui.sort_by_ordinal': 'sortColumn',
        'click @ui.sort_by_value0': 'sortColumn'
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);

        View.__super__.initialize.apply(this);
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

    sortColumn: function (e) {
        var column = $(e.target).attr('column-name') || "id";
        var order = $(e.target).data('sort') || "none";

        if (order === "asc") {
            sort_by = "-" + column;
        } else {
            sort_by = "+" + column;
        }

        this.collection.next = null;
        this.collection.fetch({reset: true, update: false, remove: true, data: {
            more: this.capacity(),
            cursor: null,
            sort_by: sort_by
        }});
    }
});

module.exports = View;
