/**
 * @file accessionrefinementlist.js
 * @brief Accession list view for refinement selection during refinement step
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-04-28
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let AccessionView = require('./accessionaction');
let AdvancedTable = require('../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: 'accession-refinement-list advanced-table-container',
    childView: AccessionView,
    userSettingName: 'accessions_refinement_list_columns',
    userSettingVersion: '0.1',

    defaultColumns: [
        {name: 'remove', width: 'auto', sort_by: null},
        {name: 'code', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'primary_classification_entry', width: 'auto', sort_by: null},
        {name: 'layout', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'remove': {
            label: '',
            width: 'auto',
            minWidth: true,
            custom: 'removeAccessionFromStep',
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
        'layout': {label: _t('Layout'), width: 'auto', minWidth: true}
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
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Accession actions"), glyphicon: 'fa-wrench'}));

        let actions = [
            'create-panel',
            'action-toggle-mode',
            'export-list',
            'import-list'
        ];

        let AccessionListContextView = require('../views/accession/accessionlistcontext');
        let contextView = new AccessionListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("panel:create", function () {
            view.onCreatePanel();
        });

        contextView.on("action:toggle-mode", function () {
            // view.onActionToggleMode();
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
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
