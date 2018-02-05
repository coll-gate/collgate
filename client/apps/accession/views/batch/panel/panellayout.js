/**
 * @file panellayout.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-06
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../../../main/views/layout');
let ContentBottomFooterLayout = require('../../../../main/views/contentbottomfooterlayout');
let ScrollingMoreView = require('../../../../main/views/scrollingmore');
let EntityListFilterView = require('../../../../descriptor/views/entitylistfilter');
let DescriptorCollection = require('../../../../descriptor/collections/layoutdescriptor');

let Layout = LayoutView.extend({
    template: require("../../../templates/batchpanellayout.html"),
    templateContext: function () {
        return {
            bat_amount: this.model.get('batches_amount')
        }
    },

    ui: {
        batches_tab: 'a[aria-controls=batches]',
        batches_badge: '#batches-badge'
    },

    regions: {
        'descriptors': "div.tab-pane[name=descriptors]",
        'batches': "div.tab-pane[name=batches]"
    },

    initialize: function (options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:layout', this.onLayoutChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onPanelCreate, this);
        }
    },

    onPanelCreate: function () {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/accession/batchpanel/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },

    updateBatchesAmount: function (nb) {
        this.ui.batches_badge.html(nb);
        // this.childView('bottom').onUpdateCount(nb)
        // this.render()
    },

    disableEntitiesTab: function () {
        this.ui.batches_tab.parent().addClass('disabled');
    },

    enableTabs: function () {
        this.ui.batches_tab.parent().removeClass('disabled');
    },

    onLayoutChange: function (model, value) {
        let panelLayout = this;
        if (value == null) {
            let BatchPanelDescriptorCreateView = require('./paneldescriptorcreate');
            let batchPanelDescriptorCreateView = new BatchPanelDescriptorCreateView({model: model});

            panelLayout.showChildView('descriptors', batchPanelDescriptorCreateView);

            if (panelLayout.initialTab === 'descriptors') {
                batchPanelDescriptorCreateView.onShowTab();
            }

        } else {
            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', value]),
                dataType: 'json'
            }).done(function (data) {

                panelLayout.descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });

                panelLayout.descriptorCollection.fetch().then(function () {
                    let PanelDescriptorView = require('./paneldescriptor');
                    let panelDescriptorView = new PanelDescriptorView({
                        model: model,
                        layoutData: data,
                        descriptorCollection: panelLayout.descriptorCollection
                    });
                    panelLayout.showChildView('descriptors', panelDescriptorView);

                    if (panelLayout.initialTab === 'descriptors') {
                        panelDescriptorView.onShowTab();
                    }
                });
            });
        }
    },

    onRender: function () {
        let panelLayout = this;

        if (this.model.isNew()) {
            this.model.save();
        }

        // batch tab
        let BatchCollection = require('../../../collections/batch');
        let batchPanelBatches = new BatchCollection([], {panel_id: this.model.get('id')});


        let columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.batch'}
        });

        columns.done(function (data) {
            if (!panelLayout.isRendered()) {
                return;
            }

            let BatchListView = require('./batchlist');
            let batchListView = new BatchListView({
                collection: batchPanelBatches,
                model: panelLayout.model,
                columns: data[0].value,
                collectionEvents: {
                    'update': 'updateAmount'
                },
                layoutView: panelLayout,
                relatedEntity: {
                    'content_type': 'accession.batchpanel',
                    'id': panelLayout.model.id
                }
            });

            let contentBottomFooterLayout = new ContentBottomFooterLayout();
            panelLayout.showChildView('batches', contentBottomFooterLayout);

            contentBottomFooterLayout.showChildView('content', batchListView);
            contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                collection: batchPanelBatches,
                targetView: batchListView
            }));

            contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                collection: batchPanelBatches,
                columns: data[0].value
            }));

            batchListView.query();
            batchListView.updateAmount(); // todo: temporary fix... not necessary for ../accession/panellayout.js! why?

            if (panelLayout.initialTab === 'batches') {
                batchListView.onShowTab();
            }
        });

        this.onLayoutChange(this.model, this.model.get('layout'));
        this.enableTabs();
    }
});

module.exports = Layout;
