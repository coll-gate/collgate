/**
 * @file batchactionlist.js
 * @brief Batch actions list for a specific batch
  * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2018-01-19
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchActionView = require('./batchaction');
let AdvancedTable = require('../../../main/views/advancedtable');
let Dialog = require('../../../main/views/dialog');
let DefaultLayout = require('../../../main/views/defaultlayout');
let TitleView = require('../../../main/views/titleview');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');
let BatchModel = require('../../models/batch');
let BatchActionModel = require('../../models/batchaction');
let BatchLayout = require('./batchlayout');

let View = AdvancedTable.extend({
    template: require("../../../descriptor/templates/entitylist.html"),
    className: "batch-action-list advanced-table-container",
    childView: BatchActionView,
    childViewContainer: 'tbody.entity-list',
    userSettingVersion: '1.0',

    userSettingName: function () {
        return 'batch_action_list_columns';
    },

    defaultColumns: [
        {name: 'select', width: 'auto', sort_by: null},
        // {name: 'name', width: 'auto', sort_by: '+0'},
    ],

    columnsOptions: {
        'select': {
            label: '',
            width: 'auto',
            type: 'checkbox',
            glyphicon: ['fa-square-o', 'fa-square-o'],
            event: 'selectBatchAction',
            fixed: true
        },
        // 'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-batch-details'},
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

        let self = this;

        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Batches actions")}));

        let actions = [
        ];

        // @todo what needed
        // let AccessionBatchesContextView = require('./batchactionlistcontext');
        // let contextView = new AccessionBatchesContextView({actions: actions});
        // contextLayout.showChildView('content', contextView);
    },

    onHideTab: function () {
        window.application.main.defaultRightView();
    },
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
