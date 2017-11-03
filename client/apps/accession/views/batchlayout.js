/**
 * @file batchlayout.js
 * @brief Optimized layout for batch details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../main/views/layout');
let AccessionModel = require('../models/accession');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let ContentBottomLayout = require('../../main/views/contentbottomlayout');
let BatchPathView = require('../views/batchpath');
let BatchDescriptorEditView = require('../views/batchdescriptoredit');

let Layout = LayoutView.extend({
    template: require("../templates/batchlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        descriptors_tab: 'a[aria-controls=descriptors]',
        parents_tab: 'a[aria-controls=parents]',
        batches_tab: 'a[aria-controls=batches]',
        actions_tab: 'a[aria-controls=actions]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'parents': "div.tab-pane[name=parents]",
        'batches': "div.tab-pane[name=batches]",
        'actions': "div.tab-pane[name=actions]"
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

    onDescriptorMetaModelChange: function (model, value) {
        if (value) {
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

                let BatchDescriptorView = require('../views/batchdescriptor');
                let batchDescriptorView = new BatchDescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });
                batchLayout.showChildView('descriptors', batchDescriptorView);

                // manually called
                if (batchLayout.activeTab === 'descriptors') {
                    batchDescriptorView.onShowTab();
                }
            });
        }
    },

    onRender: function () {
        let batchLayout = this;

        if (!this.model.isNew()) {
            // details
            let accession = new AccessionModel({id: this.model.get('accession')});
            accession.fetch().then(function () {
                if (!batchLayout.isRendered()) {
                    return;
                }

                batchLayout.showChildView('details', new BatchPathView({
                    model: batchLayout.model,
                    accession: accession
                }));
            });

            // get available columns
            let columns = application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'accession.batch'}
            });

            // parents batches tab
            let BatchCollection = require('../collections/batch');
            let parentBatches = new BatchCollection([], {batch_id: this.model.get('id'), batch_type: 'parents'});

            $.when(columns, parentBatches.fetch()).then(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let BatchListView = require('../views/batchlist');
                let batchListView = new BatchListView({
                    collection: parentBatches, model: batchLayout.model, columns: data[0].value
                });

                let contentBottomLayout = new ContentBottomLayout();
                batchLayout.showChildView('parents', contentBottomLayout);

                contentBottomLayout.showChildView('content', batchListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: batchListView}));
            });

            // children batches tab
            let childrenBatches = new BatchCollection([], {batch_id: this.model.get('id'), batch_type: 'children'});

            $.when(columns, childrenBatches.fetch()).then(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let BatchListView = require('../views/batchlist');
                let batchListView = new BatchListView({
                    collection: childrenBatches, model: batchLayout.model, columns: data[0].columns
                });

                let contentBottomLayout = new ContentBottomLayout();
                batchLayout.showChildView('batches', contentBottomLayout);

                contentBottomLayout.showChildView('content', batchListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: batchListView}));
            });
        } else {
            // details
            let accession = new AccessionModel({id: this.model.get('accession')});
            accession.fetch().then(function () {
                if (!batchLayout.isRendered()) {
                    return;
                }

                batchLayout.showChildView('details', new BatchPathView({
                    model: batchLayout.model, accession: accession, noLink: true
                }));
            });

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
