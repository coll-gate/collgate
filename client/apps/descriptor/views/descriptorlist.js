/**
 * @file descriptorlist.js
 * @brief List of descriptors view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorView = require('./descriptor');
let AdvancedTable = require('../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: "object descriptor-group-list advanced-table-container",
    childView: DescriptorView,
    userSettingName: 'descriptor_list_columns',
    userSettingVersion: '1.4',

    defaultColumns: [
        {name: 'lock', width: 'auto', sort_by: null},
        {name: 'code', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: null},
        {name: 'label', width: 'auto', sort_by: null},
        {name: 'group_name', width: 'auto', sort_by: '+0'}
    ],

    columnsOptions: {
        'lock': {
            label: '',
            width: 'auto',
            glyphicon: ['fa-lock', 'fa-lock'],
            fixed: true
        },
        'code': {label: _t('Code'), width: 'auto', minWidth: true, event: 'view-descriptor-details'},
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-descriptor-details'},
        'label': {label: _t('Label'), width: 'auto', minWidth: true, event: 'view-descriptor-details'},
        'group_name': {width: 'auto', minWidth: true}
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
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Actions on descriptors"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [
            'create-descriptor'
        ];

        let ListContextView = require('./descriptorlistcontext');
        let contextView = new ListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("descriptor:create", function () {
            view.onCreateDescriptor();
        });

        View.__super__.onShowTab.apply(this, arguments);
    },

    onBeforeDetach: function () {
        application.main.defaultRightView();
    },

    onCreateDescriptor: function () {
        window.application.descriptor.controllers.descriptor.create();
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
