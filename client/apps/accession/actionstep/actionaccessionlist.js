/**
 * @file actionaccessionlist.js
 * @brief Advanced table with a specialization for action on accessions.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-04-13
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let AccessionView = require('../views/accession/accession');
let AdvancedTable = require('../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    template: require("../../descriptor/templates/entitylist.html"),
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
        let view = this;

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
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

    onUnlinkAccessions: function () {

        if (!this.getSelection('select')) {
            $.alert.warning(_t("No accession selected"));
            return;
        }

        let view = this;
        $.ajax({
                type: 'PATCH',
                url: window.application.url(['accession', 'accessionaction', this.model.id, 'accessions']),
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    'action': 'remove',
                    'selection': {
                        'select': view.getSelection('select'),
                        'from': {
                            'content_type': 'accession.accessionpanel',
                            'id': view.model.id
                        },
                        'filters': this.collection.filters
                        // 'search': search
                    }
                })
            }
        ).done(function () {
            if (view.getSelection('select').op === 'in') {
                // this condition by pass auto-request loop to retrieve last user position in the table
                view.collection.remove(view.getSelection('select').value);
            } else {
                view.collection.fetch();
            }
            view.collection.count();
        });
    },

    updateAmount: function () {
        // update the accessions amount badge only if layout view is specified
        let panelLayoutView = this.getOption('layoutView', null);

        if (!panelLayoutView) {
            console.error("Panel layout view is missing: updateAmount() can not find amount badge to update");
            return
        }
        $.ajax({
                type: 'GET',
                url: window.application.url(['accession', 'accessionaction', this.model.id, 'accessions', 'count']),
                dataType: 'json',
                contentType: "application/json; charset=utf-8"
            }
        ).done(function (data) {
            panelLayoutView.model.set('accessions_amount', data.count);
            panelLayoutView.updateAccessionsAmount(data.count);
        });
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
