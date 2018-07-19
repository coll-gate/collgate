/**
 * @file accessionlist.js
 * @brief Accession list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let AccessionView = require('./accession');
let AdvancedTable = require('../../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: 'accession-list advanced-table-container',
    childView: AccessionView,
    userSettingName: 'accessions_list_columns',
    userSettingVersion: '1.2',

    defaultColumns: [
        {name: 'select', width: 'auto', sort_by: null},
        {name: 'code', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'primary_classification_entry', width: 'auto', sort_by: null},
        {name: 'layout', width: 'auto', sort_by: null},
        // {name: 'synonym', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'select': {
            label: '',
            width: 'auto',
            type: 'checkbox',
            glyphicon: ['fa-square-o', 'fa-square-o'],
            event: 'accession-select',
            fixed: true
        },
        'code': {label: _t('Code'), width: 'auto', minWidth: true, event: 'view-accession-details'},
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-accession-details'},
        'primary_classification_entry': {
            label: _t('Classification'),
            width: 'auto',
            minWidth: true,
            event: 'view-primary-classification-entry-details',
            custom: 'primaryClassificationEntryCell',
            field: 'name'
        },
        'layout': {label: _t('Layout'), width: 'auto', minWidth: true},
        // 'synonym': {
        //     label: _t('Synonym'),
        //     width: 'auto',
        //     minWidth: true,
        //     custom: 'synonymCell',
        //     field: 'name'
        // }
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        this.relatedEntity = this.getOption('relatedEntity');
        this.filters = this.getOption('filters');
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
        contextLayout.showChildView('title', new TitleView({title: _t("Accession actions"), glyphicon: 'fa-wrench'}));

        let actions = [
            'create-panel',
            'link-to-panel',
            'export-list',
            'import-list'
        ];

        let AccessionListContextView = require('./accessionlistcontext');
        let contextView = new AccessionListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("panel:create", function () {
            view.onCreatePanel();
        });

        contextView.on("panel:link-accessions", function () {
            view.onLinkToPanel();
        });

        contextView.on("accession:export", function () {
            view.onExportList();
        });

        View.__super__.onShowTab.apply(this, arguments);
    },

    onBeforeDetach: function () {
        window.application.main.defaultRightView();
    },

    onCreatePanel: function () {
        if (!this.getSelection('select')) {
            $.alert.warning(_t("No accession selected"));
        } else {
            window.application.accession.controllers.accessionpanel.create(
                this.getSelection('select'), this.relatedEntity, this.collection.filters, this.collection.search);
        }
    },

    onLinkToPanel: function () {
        window.application.accession.controllers.accessionpanel.linkAccessions(
            this.getSelection('select'), this.relatedEntity, this.collection.filters, this.collection.search);
    },

    onExportList: function() {
        let columns = ['id'];  // @todo get selected columns

        $.ajax({
            type: "GET",
            url: window.application.url(['main', 'export']),
            dataType: 'json',
            data: {
                'app_label': 'accession',
                'model': 'accession',
                'format': '',
                'columns': columns
            }
        }).done(function (data) {

        });
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
