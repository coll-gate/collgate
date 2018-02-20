/**
 * @file descriptorindexlist.js
 * @brief list of indexes
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-02-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorIndexView = require('./descriptorindex');
let AdvancedTable = require('../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: "object index-list advanced-table-container",
    childView: DescriptorIndexView,
    userSettingName: 'index_list_columns',
    userSettingVersion: '1.5',

    defaultColumns: [
        // {name: 'select', width: 'auto', sort_by: null},
        {name: 'descriptor', width: 'auto', sort_by: '+0'},
        {name: 'target', width: 'auto', sort_by: null},
        {name: 'type', width: 'auto', sort_by: null},
    ],
    //
    // columnsOptions: {
    //     // 'select': {
    //     //     label: '',
    //     //     width: 'auto',
    //     //     type: 'checkbox',
    //     //     glyphicon: ['fa-square-o', 'fa-square-o'],
    //     //     // event: 'accession-select',
    //     //     fixed: true
    //     // },
    //     'code': {label: _t('Code'), width: 'auto', minWidth: true, event: 'view-descriptor-details'},
    //     'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-descriptor-details'},
    //     'label': {label: _t('Label'), width: 'auto', minWidth: true, event: 'view-descriptor-details'},
    // },

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
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Actions on indexes"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [
            'create-index'
        ];

        let ListContextView = require('./indexlistcontext');
        let contextView = new ListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("index:create", function () {
            view.onCreateIndex();
        });

        View.__super__.onShowTab.apply(this, arguments);
    },

    onBeforeDetach: function () {
        window.application.main.defaultRightView();
    },

    onCreateIndex: function () {
        window.application.descriptor.controllers.index.create(this.collection);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
