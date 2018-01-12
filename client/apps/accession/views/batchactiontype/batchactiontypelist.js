/**
 * @file batchactiontypelist.js
 * @brief Batch action type list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchActionTypeView = require('./batchactiontype');
let AdvancedTable = require('../../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: 'batchactiontype-list advanced-table-container',
    childView: BatchActionTypeView,
    userSettingName: 'batchactiontype_list_columns',
    userSettingVersion: '1.0',

    defaultColumns: [
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: '@label', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-batchactiontype-details'},
        '@label': {label: _t('Label'), width: 'auto', minWidth: true, event: 'view-batchactiontype-details'},
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        this.filters = this.getOption('filters');
    },

    onRender: function () {
        View.__super__.onRender.apply(this, arguments);
        this.onShowTab();
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
        contextLayout.showChildView('title', new TitleView({title: _t("Actions on batch action type"), glyphicon: 'fa-wrench'}));

        let actions = [
            'create-batch-action-type'
        ];

        let ListContextView = require('./batchactiontypelistcontext');
        let contextView = new ListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("batch-action-type:create", function () {
            view.onCreateDescriptor();
        });

        View.__super__.onShowTab.apply(this, arguments);
    },

    onBeforeDetach: function () {
        application.main.defaultRightView();
    },

    onCreateDescriptor: function() {
        window.application.accession.controllers.batchactiontype.create();
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
