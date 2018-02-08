/**
 * @file actionlist.js
 * @brief Batch actions list for a specific batch
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2018-01-19
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionView = require('./action');
let AdvancedTable = require('../../../main/views/advancedtable');
let Dialog = require('../../../main/views/dialog');
let DefaultLayout = require('../../../main/views/defaultlayout');
let TitleView = require('../../../main/views/titleview');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');
let BatchModel = require('../../models/batch');
let BatchActionModel = require('../../models/action');

let View = AdvancedTable.extend({
    template: require("../../../descriptor/templates/entitylist.html"),
    className: "action-list advanced-table-container",
    childView: ActionView,
    childViewContainer: 'tbody.entity-list',
    userSettingVersion: '1.0',

    userSettingName: function () {
        return 'batch_action_list_columns';
    },

    defaultColumns: [
        {name: 'select', width: 'auto', sort_by: null},
        {name: 'type', width: 'auto', sort_by: '+0'},
        {name: 'accession', width: 'auto', sort_by: '+0'},
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
        'type': {
            label: _t('Type'),
            width: 'auto',
            minWidth: true,
            field: 'name'
        },
        'accession': {
            label: _t('Accession'),
            width: 'auto',
            minWidth: true,
            field: 'name'
        }
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

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Batches actionstep")}));

        let actions = [
        ];

        // @todo what needed
        // let AccessionBatchesContextView = require('./batchactionlistcontext');
        // let contextView = new AccessionBatchesContextView({actionstep: actionstep});
        // contextLayout.showChildView('content', contextView);
    },

    onHideTab: function () {
        window.application.main.defaultRightView();
    },
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;