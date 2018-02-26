/**
 * @file descriptorvaluelist.js
 * @brief List of values for a type of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorValueView = require('../views/descriptorvalue');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/descriptorvaluelist.html"),
    className: "object descriptor-value-list advanced-table-container",
    childView: DescriptorValueView,
    childViewContainer: 'tbody.descriptor-value-list',

    templateContext: function () {
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
        sort_by_value0: "th span.action.column-sort-value0"
    },

    events: {
        'click @ui.sort_by_id': 'sortColumn',
        'click @ui.sort_by_value0': 'sortColumn'
    },

    initialize: function () {
        View.__super__.initialize.apply(this);
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
    },

    onShowTab: function () {
        let view = this;

        if (!this.model.get('can_modify') || !window.application.permission.manager.isStaff()) {
            return
        }

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Actions on descriptor values"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [
            'create-value'
        ];

        let ListContextView = require('./valuelistcontext');
        let contextView = new ListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("value:create", function () {
            view.onCreateValue();
        });

        View.__super__.onShowTab.apply(this, arguments);
    },

    onBeforeDetach: function () {
        window.application.main.defaultRightView();
    },

    onCreateValue: function () {
        this.collection.create({value0: _t("New value")});
    },

    onRender: function () {
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
        let sort_by = "";

        if (order === "asc") {
            sort_by = "-" + column;
        } else {
            sort_by = "+" + column;
        }

        this.collection.next = null;
        this.collection.fetch({
            reset: true, update: false, remove: true, data: {
                // more: this.capacity()+1,
                cursor: null,
                sort_by: sort_by
            }
        });
    }
});

module.exports = View;