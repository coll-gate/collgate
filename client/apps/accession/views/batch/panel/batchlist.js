/**
 * @file batchlist.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-06
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchView = require('./batch');
let AdvancedTable = require('../../../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    template: require("../../../../descriptor/templates/entitylist.html"),
    className: 'advanced-table-container',
    childView: BatchView,
    childViewContainer: 'tbody.entity-list',
    userSettingName: 'panel_batches_list_columns',
    userSettingVersion: '1.0',

    defaultColumns: [
        {name: 'select', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'layout', width: 'auto', sort_by: null},
    ],

    columnsOptions: {
        'select': {
            label: '',
            width: 'auto',
            type: 'checkbox',
            glyphicon: ['fa-square-o', 'fa-square-o'],
            event: 'batch-select',
            fixed: true
        },
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-batch-details'},
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

        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({
            title: _t("Batch actions"),
            glyphicon: 'fa-wrench'
        }));

        let actions = [
            'create-panel',
            'link-to-panel',
            'unlink-batches'
        ];

        let PanelBatchListContextView = require('../batchlistcontext');
        let contextView = new PanelBatchListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("panel:create", function () {
            view.onCreatePanel();
        });
        contextView.on("panel:link-batches", function () {
            view.onLinkToPanel();
        });
        contextView.on("batches:unlink", function () {
            view.onUnlinkBatches();
        });

        View.__super__.onShowTab.apply(this, arguments);
    },

    onBeforeDetach: function () {
        application.main.defaultRightView();
    },

    onUnlinkBatches: function () {

        if (!this.getSelection('select')) {
            $.alert.warning(_t("No batch selected"));
            return;
        }

        let view = this;
        $.ajax({
                type: 'PATCH',
                url: window.application.url(['accession', 'batchpanel', this.model.id, 'batches']),
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    'action': 'remove',
                    'selection': {
                        'select': view.getSelection('select'),
                        'from': {
                            'content_type': 'accession.batchpanel',
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
        // update the batches amount badge only if layout view is specified
        let panelLayoutView = this.getOption('layoutView', null);

        if (!panelLayoutView) {
            console.error("Panel layout view is missing: updateAmount() can not find amount badge to update");
            return
        }
        panelLayoutView.updateBatchesAmount(this.model.count);

        // $.ajax({
        //         type: 'GET',
        //         url: window.application.url(['accession', 'batchpanel', this.model.id, 'batches', 'count']),
        //         dataType: 'json',
        //         contentType: "application/json; charset=utf-8"
        //     }
        // ).done(function (data) {
        //     panelLayoutView.model.set('batches_amount', data.count);
        //     panelLayoutView.updateBatchesAmount(data.count);
        // });
    },

    onCreatePanel: function () {
        if (!this.getSelection('select')) {
            $.alert.warning(_t("No batch selected"));
        } else {
            application.accession.controllers.batchpanel.create(this.getSelection('select'), this.relatedEntity, this.collection.filters, this.collection.search);
        }
    },

    onLinkToPanel: function () {
        application.accession.controllers.batchpanel.linkBatches(this.getSelection('select'), this.relatedEntity, this.collection.filters, this.collection.search);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
