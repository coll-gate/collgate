/**
 * @file batchlist.js
 * @brief Batch list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchView = require('./batch');
let AdvancedTable = require('../../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: "batch-list advanced-table-container",
    childView: BatchView,
    childViewContainer: 'tbody.entity-list',
    userSettingVersion: '1.0',

    userSettingName: function () {
        if (this.collection.batch_type === 'parents') {
            return 'parents_batches_list_columns';
        } else if (this.collection.batch_type === 'children') {
            return 'children_batches_list_columns';
        } else {
            return 'batches_list_columns';
        }
    },

    defaultColumns: [
        {name: 'select', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
    ],

    columnsOptions: {
        'select': {
            label: '',
            width: 'auto',
            type: 'checkbox',
            glyphicon: ['fa-square-o', 'fa-square-o'],
            event: 'selectBatch',
            fixed: true
        },
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-batch-details'},
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
            columnsOptions: this.getOption('columns')
        }
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);
        this.accessionId = options.accessionId || -1;
    },

    onShowTab: function () {
        View.__super__.onShowTab.apply(this);

        let self = this;

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Batches actions")}));

        let actions = [
            'create-panel',
            'link-to-panel'
        ];

        let BatchListContextView = require('./batchlistcontext');
        let contextView = new BatchListContextView({actions: actions, accessionId: self.accessionId});
        contextLayout.showChildView('content', contextView);

        contextView.on("panel:create", function () {
            self.onCreatePanel();
        });

        contextView.on("panel:link-batches", function () {
            self.onLinkToPanel();
        });

        View.__super__.onShowTab.apply(this);
    },

    onCreatePanel: function () {
        if (!this.getSelection('select')) {
            $.alert.warning(_t("No batch selected"));
        } else {
            window.application.accession.controllers.batchpanel.create(
                this.getSelection('select'),
                this.relatedEntity,
                this.collection.filters,
                this.collection.search);
        }
    },

    onBeforeDetach: function () {
        window.application.main.defaultRightView();
    },

    onLinkToPanel: function () {
        window.application.accession.controllers.batchpanel.linkBatches(
            this.getSelection('select'),
            this.relatedEntity,
            this.collection.filters,
            this.collection.search);
    },

    onHideTab: function () {
        window.application.main.defaultRightView();
    },
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
