/**
 * @file classificationentrylist.js
 * @brief Classification entry list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let ClassificationEntryView = require('./classificationentry');
let AdvancedTable = require('../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    template: require("../../descriptor/templates/entitylist.html"),
    className: "classification-entry-list advanced-table-container",
    childView: ClassificationEntryView,
    childViewContainer: 'tbody.entity-list',

    userSettingName: 'classificationentry_list_columns', //function() {
        //return /*this.classification.get('name')*/'classificationentry' + '_classification_list_columns';
    //},
    userSettingVersion: '2.1',

    defaultColumns: [
        {name: 'name', width: 'auto', sort_by: '+1'},
        {name: 'rank', width: 'auto', sort_by: '+0'},
        {name: 'parent', width: 'auto', sort_by: null},
        // {name: 'synonym', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-classification-entry-details'},
        'rank': {
            label: _t('Rank'),
            width: 'auto',
            minWidth: true,
            custom: 'rankCell',
            field: 'level'
        },
        'parent': {
            label: _t('Parent'),
            width: 'auto',
            minWidth: true,
            event: 'view-parent-details',
            custom: 'parentCell',
            field: 'name'
        },
        // 'synonym': {
        //     label: _t('Synonym'),
        //     width: 'auto',
        //     minWidth: true,
        //     custom: 'synonymCell',
        //     field: 'name'
        // }
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

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        // this.listenTo(this.collection, 'reset', this.render, this);
    },

    onShowTab: function() {
        let view = this;

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Panel actions"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [
            'export-list',
            'import-list'
        ];

        let ClassificationEntryListContextView = require('./classificationentrylistcontext');
        let contextView = new ClassificationEntryListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("classifications:import-list", function () {
            // view.onImportList();
        });

        contextView.on("classifications:import-list", function () {
            // view.onExportList();
        });
    },

    onBeforeDetach: function() {
        window.application.main.defaultRightView();
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
