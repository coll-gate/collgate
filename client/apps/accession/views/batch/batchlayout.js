/**
 * @file batchlayout.js
 * @brief Optimized layout for batch details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../../main/views/layout');
let AccessionModel = require('../../models/accession');
let ScrollingMoreView = require('../../../main/views/scrollingmore');
let ContentBottomLayout = require('../../../main/views/contentbottomlayout');
let BatchDescriptorEditView = require('./batchdescriptoredit');

let Layout = LayoutView.extend({
    template: require("../../templates/batchlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        descriptors_tab: 'a[aria-controls=descriptors]',
        parents_tab: 'a[aria-controls=parents]',
        batches_tab: 'a[aria-controls=batches]',
        actions_tab: 'a[aria-controls=actions]',
        panels_tab: 'a[aria-controls=panels]',
    },

    regions: {
        'descriptors': "div.tab-pane[name=descriptors]",
        'parents': "div.tab-pane[name=parents]",
        'batches': "div.tab-pane[name=batches]",
        'actions': "div.tab-pane[name=actions]",
        'panels': "div.tab-pane[name=panels]"

    },

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:descriptor_meta_model', this.onDescriptorMetaModelChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onBatchCreate, this);
        }
    },

    onBatchCreate: function () {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/accession/batch/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },

    disableParentsTab: function () {
        this.ui.parents_tab.parent().addClass('disabled');
    },

    disableBatchesTab: function () {
        this.ui.batches_tab.parent().addClass('disabled');
    },

    disableActionsTab: function () {
        this.ui.actions_tab.parent().addClass('disabled');
    },

    disablePanelsTab: function () {
        this.ui.panels_tab.parent().addClass('disabled');
    },

    enableTabs: function() {
        this.ui.parents_tab.parent().removeClass('disabled');
        this.ui.batches_tab.parent().removeClass('disabled');
        this.ui.actions_tab.parent().removeClass('disabled');
        this.ui.panels_tab.parent().removeClass('disabled');
    },

    onDescriptorMetaModelChange: function (model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            let batchLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'meta-model', value, 'layout']),
                dataType: 'json'
            }).done(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let BatchDescriptorView = require('./batchdescriptor');
                let batchDescriptorView = new BatchDescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });
                batchLayout.showChildView('descriptors', batchDescriptorView);

                // // manually called
                // if (batchLayout.activeTab === 'descriptors') {
                //     batchDescriptorView.onShowTab();
                // }
            });
        }
    },

    onRender: function () {
        let batchLayout = this;

        if (!this.model.isNew()) {
            // get available columns
            let columns = application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'accession.batch'}
            });

            // parents batches tab
            let BatchCollection = require('../../collections/batch');
            let parentBatches = new BatchCollection([], {batch_id: this.model.get('id'), batch_type: 'parents'});

            $.when(columns, parentBatches.fetch()).then(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let BatchListView = require('./batchlist');
                let batchListView = new BatchListView({
                    collection: parentBatches, model: batchLayout.model, columns: data[0].value
                });

                let contentBottomFooterLayout = new ContentBottomLayout();
                batchLayout.showChildView('parents', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', batchListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({targetView: batchListView}));
            });

            // children batches tab
            let childrenBatches = new BatchCollection([], {batch_id: this.model.get('id'), batch_type: 'children'});

            $.when(columns, childrenBatches.fetch()).then(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let SubBatchListView = require('./subbatchlist');
                let subbatchListView = new SubBatchListView({
                    collection: childrenBatches, model: batchLayout.model, columns: data[0].columns
                });

                let contentBottomLayout = new ContentBottomLayout();
                batchLayout.showChildView('batches', contentBottomLayout);

                contentBottomLayout.showChildView('content', subbatchListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: subbatchListView}));
            });

            // panels tab
            let PanelCollection = require('../../collections/batchpanel');
            let batchPanels = new PanelCollection({batch_id: this.model.get('id')});

            // get available columns
            let columns3 = application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'accession.batchpanel'}
            });

            $.when(columns3, batchPanels.fetch()).then(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let BatchPanelListView = require('./batchpanellist');
                let batchPanelListView  = new BatchPanelListView({
                    collection: batchPanels, model: batchLayout.model, columns: data[0].value});

                let contentBottomLayout = new ContentBottomLayout();
                batchLayout.showChildView('panels', contentBottomLayout);

                contentBottomLayout.showChildView('content', batchPanelListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: batchPanelListView}));

                batchPanelListView.query();
            });



            this.onDescriptorMetaModelChange(this.model, this.model.get('descriptor_meta_model'));
            this.enableTabs();
        } else {
            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'meta-model', this.model.get('descriptor_meta_model'), 'layout']),
                dataType: 'json'
            }).done(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let batchDescriptorView = new BatchDescriptorEditView({
                    model: batchLayout.model, descriptorMetaModelLayout: data
                });

                batchLayout.showChildView('descriptors', batchDescriptorView);
            });

            // not available tabs
            this.disableParentsTab();
            this.disableBatchesTab();
            this.disableActionsTab();
        }
    }
});

module.exports = Layout;
