/**
 * @file panellist.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-06
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let PanelView = require('./panel');
let AdvancedTable = require('../../../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    template: require("../../../../descriptor/templates/entitylist.html"),
    className: "panel-list advanced-table-container",
    childView: PanelView,
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
            columnsOptions: this.getOption('columns')
        }
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);
    },

    onRender: function () {
        View.__super__.onRender.apply(this, arguments);
        //this.onShowTab();
    },

    onUnion: function () {
        alert('todo!')
    },

    onIntersection: function () {
        alert('todo!')
    },

    onCreatePanel: function () {
        application.accession.controllers.batchpanel.create();
    },

    onBeforeDetach: function () {
        application.main.defaultRightView();
    },

    onShowTab: function () {
        let view = this;

        let DefaultLayout = require('../../../../main/views/defaultlayout');
        let contextLayout = new DefaultLayout();
        application.getView().showChildView('right', contextLayout);

        let actions = [
            'create-panel',
            'union',
            'intersection'
        ];

        let PanelListContextView = require('./panellistcontext');
        let contextView = new PanelListContextView({actions: actions});

        let TitleView = require('../../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Panel actions"), glyphicon: 'fa-wrench'}));
        contextLayout.showChildView('content', contextView);

        contextView.on("panel:create", function () {
            view.onCreatePanel();
        });
        contextView.on("panel:union", function () {
            view.onUnion();
        });
        contextView.on("panel:intersection", function () {
            view.onIntersection();
        });

        View.__super__.onShowTab.apply(this, arguments);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
