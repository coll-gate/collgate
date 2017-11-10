/**
 * @file subbatchlist.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-06
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchView = require('./batch');
let AdvancedTable = require('../../../main/views/advancedtable');
let Dialog = require('../../../main/views/dialog');
let DefaultLayout = require('../../../main/views/defaultlayout');
let TitleView = require('../../../main/views/titleview');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');
let AccessionModel = require('../../models/accession');
let BatchModel = require('../../models/batch');
let BatchLayout = require('./batchlayout');

let View = AdvancedTable.extend({
    template: require("../../../descriptor/templates/entitylist.html"),
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

        // this.listenTo(this.collection, 'reset', this.render, this);
    },

    onShowTab: function () {
        View.__super__.onShowTab.apply(this);

        // context only for children (sub-batches)
        if (this.collection.batch_type !== 'parents') {
            let view = this;

            let contextLayout = application.getView().getChildView('right');
            if (!contextLayout) {
                let DefaultLayout = require('../../../main/views/defaultlayout');
                contextLayout = new DefaultLayout();
                application.getView().showChildView('right', contextLayout);
            }

            let TitleView = require('../../../main/views/titleview');
            contextLayout.showChildView('title', new TitleView({title: _t("Batches actions")}));

            let actions = ['create'];

            let AccessionBatchesContextView = require('./subbatchlistcontext');
            let contextView = new AccessionBatchesContextView({actions: actions});
            contextLayout.showChildView('content', contextView);

            contextView.on("batch:create", function () {
                let select = {
                    "op": 'in',
                    "term": 'id',
                    "value": [view.model.id]
                };
                application.accession.controllers.batch.create(select);

            });
            contextView.on("batch:unlink", function () {
                application.accession.controllers.batch.unlinkBatches(this);
            });
        }
    },

    onHideTab: function () {
        application.main.defaultRightView();
    },
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;