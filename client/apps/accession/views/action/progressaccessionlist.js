/**
 * @file progressaccessionlist.js
 * @brief Advanced table with a specialization for action on accessions.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-04-13
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let AccessionView = require('../accession/accession');
let AdvancedTable = require('../../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    template: require("../../../descriptor/templates/entitylist.html"),
    className: 'advanced-table-container',
    childView: AccessionView,
    childViewContainer: 'tbody.entity-list',
    userSettingName: 'action_accession_list_columns',
    userSettingVersion: '1.0',

    defaultColumns: [
        {name: 'select', width: 'auto', sort_by: null},
        {name: 'code', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
    ],

    columnsOptions: {
        'validate': {
            label: '',
            width: 'auto',
            custom: 'validateAccessionCell',
            event: 'accession-validate',
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
        this.relatedEntity = this.getOption('relatedEntity');
    },

    onShowTab: function () {
        let self = this;

        // load data on show tab

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Accession actions"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [
            'play-pause'
        ];

        // let PanelAccessionListContextView = require('../actionentitylistcontext');
        // let contextView = new PanelAccessionListContextView({actions: actions});
        // contextLayout.showChildView('content', contextView);
        //
        // contextView.on("panel:create", function () {
        //     view.onCreatePanel();
        // });
        // contextView.on("panel:link-accessions", function () {
        //     view.onLinkToPanel();
        // });
        // contextView.on("accessions:unlink", function () {
        //     view.onUnlinkAccessions();
        // });

        View.__super__.onShowTab.apply(this, arguments);
    },

    onBeforeDetach: function () {
        window.application.main.defaultRightView();
    },

    primaryClassificationEntryCell: function (td, value) {
        if (value && value.rank) {
            td.popupcell('init', {
                label: value.name,
                className: 'classification-rank',
                type: 'entity',
                format: {
                    model: 'classification.classificationrank',
                    details: true
                },
                value: value.rank
            });
        }
    },

    validateAccessionCell: function(td, value) {
        // @todo
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
