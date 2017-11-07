/**
 * @file batchpanellist.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchPanelView = require('./batchpanel');
let AdvancedTable = require('../../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    template: require("../../../descriptor/templates/entitylist.html"),
    className: "panel-list advanced-table-container",
    childView: BatchPanelView,
    childViewContainer: 'tbody.entity-list',
    userSettingName: 'panel_list_columns',
    userSettingVersion: '1.0',

    defaultColumns: [
        // {name: 'select', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'}
    ],

    columnsOptions: {
        // 'select': {
        //     label: '',
        //     width: 'auto',
        //     type: 'checkbox',
        //     glyphicon: ['fa-square-o', 'fa-square-o'],
        //     event: 'panel-select',
        //     fixed: true
        // },
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-panel-details'}
    },

    templateContext: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    childViewOptions: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns'),
            batchId: this.model.id
        }
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);
    },

    onRender: function () {
        View.__super__.onRender.apply(this, arguments);
        this.onShowTab();
    },

    onLinkToPanel: function () {
        let selection = {
            "op": 'in',
            "term": 'id',
            "value": [this.model.id]
        };
        application.accession.controllers.batchpanel.linkBatches(selection, null, null, null, this.collection);
    },

    onShowTab: function () {
        let view = this;

        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Panel actions"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [
            'link-to-panel'
        ];

        let PanelBatchListContextView = require('./batchlistcontext');
        let contextView = new PanelBatchListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("panel:link-batches", function () {
            view.onLinkToPanel();
        });

        View.__super__.onShowTab.apply(this, arguments);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
