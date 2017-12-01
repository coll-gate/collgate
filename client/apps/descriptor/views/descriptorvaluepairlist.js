/**
 * @file descriptorvaluepairlist.js
 * @brief List of pair values for a type of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-08-01
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let DescriptorValueModel = require('../models/descriptorvalue');
let DescriptorValuePairView = require('../views/descriptorvaluepair');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/descriptorvaluepairlist.html"),
    className: "object descriptor-value-list advanced-table-container",
    childView: DescriptorValuePairView,
    childViewContainer: 'tbody.descriptor-value-list',

    templateContext: function() {
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
        'click @ui.sort_by_value1': 'sortColumn'
    },

    initialize: function() {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.collection, 'reset', this.render, this);
    },

    onRender: function() {
        let sort_by = /([+\-]{0,1})([a-z0-9]+)/.exec(this.collection.sort_by);
        let sort_el = this.$el.find('span[column-name="' + sort_by[2] + '"]');

        if (sort_by[1] === '-') {
            sort_el.addClass('fa-sort-desc');
            sort_el.attr('sort-direction', 'desc');
        } else {
            sort_el.addClass('fa-sort-asc');
            sort_el.attr('sort-direction', 'asc');
        }

        // reset scrolling
        this.getScrollElement().scrollTop(0);
    },

    sortColumn: function (e) {
        let column = $(e.target).attr('column-name') || "id";
        let order = $(e.target).attr('sort-direction') || "none";

        if (order === "asc") {
            sort_by = "-" + column;
        } else {
            sort_by = "+" + column;
        }

        this.collection.next = null;
        this.collection.fetch({reset: true, update: false, remove: true, data: {
            // more: this.capacity()+1,
            cursor: null,
            sort_by: sort_by
        }});
    }
});

module.exports = View;
