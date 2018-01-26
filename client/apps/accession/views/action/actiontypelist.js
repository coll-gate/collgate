/**
 * @file actiontypelist.js
 * @brief Action type list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionTypeView = require('./actiontype');
let AdvancedTable = require('../../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: 'action-list advanced-table-container',
    childView: ActionTypeView,
    userSettingName: 'actiontype_list_columns',
    userSettingVersion: '1.0',

    defaultColumns: [
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: '@label', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-action-details'},
        '@label': {label: _t('Label'), width: 'auto', minWidth: true, event: 'view-action-details'},
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

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Options"), glyphicon: 'fa-wrench'}));

        let actions = [
            'create-action-type'
        ];

        let ListContextView = require('./actiontypelistcontext');
        let contextView = new ListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("action-type:create", function () {
            view.onCreateActionType();
        });

        View.__super__.onShowTab.apply(this, arguments);
    },

    onBeforeDetach: function () {
        window.application.main.defaultRightView();
    },

    onCreateActionType: function() {
        window.application.accession.controllers.actiontype.create();
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
