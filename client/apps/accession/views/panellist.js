/**
 * @file panellist.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var PanelView = require('../views/panel');
var AdvancedTable = require('../../main/views/advancedtable');
var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = AdvancedTable.extend({
    template: require("../../descriptor/templates/entitylist.html"),
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
        this.onShowTab();
    },

    onUnion: function () {
        alert('todo!')
    },

    onIntersection: function () {
        alert('todo!')
    },

    onCreatePanel: function () {
        application.accession.controllers.panel.create();
    },

    onShowTab: function () {
        var view = this;

        var DefaultLayout = require('../../main/views/defaultlayout');
        var contextLayout = new DefaultLayout();
        application.getView().showChildView('right', contextLayout);

        var actions = [
            'create-panel',
            'union',
            'intersection'
        ];

        var PanelListContextView = require('./panellistcontext');
        var contextView = new PanelListContextView({actions: actions});

        var TitleView = require('../../main/views/titleview');
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
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
