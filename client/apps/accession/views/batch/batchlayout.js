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
let ContentBottomFooterLayout = require('../../../main/views/contentbottomfooterlayout');
let BatchDescriptorEditView = require('./batchdescriptoredit');
let DescriptorCollection = require('../../../descriptor/collections/layoutdescriptor');
let EntityListFilterView = require('../../../descriptor/views/entitylistfilter');

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
        comments_tab: 'a[aria-controls=comments]'
    },

    regions: {
        'details': "div.batch-details",
        'descriptors': "div.tab-pane[name=descriptors]",
        'parents': "div.tab-pane[name=parents]",
        'batches': "div.tab-pane[name=batches]",
        'actions': "div.tab-pane[name=actions]",
        'panels': "div.tab-pane[name=panels]",
        'comments': "div.tab-pane[name=comments]"
    },

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:layout', this.onLayoutChange, this);

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

    disableCommentsTab: function () {
        this.ui.comments_tab.parent().addClass('disabled');
    },

    enableTabs: function () {
        this.ui.parents_tab.parent().removeClass('disabled');
        this.ui.batches_tab.parent().removeClass('disabled');
        this.ui.actions_tab.parent().removeClass('disabled');
        this.ui.panels_tab.parent().removeClass('disabled');
        this.ui.comments_tab.parent().removeClass('disabled');
    },

    onLayoutChange: function (model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            let batchLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', value]),
                dataType: 'json'
            }).done(function (data) {
                let view = this;

                this.descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });
                this.descriptorCollection.fetch().then(function () {
                    if (!batchLayout.isRendered()) {
                        return;
                    }

                    let BatchDescriptorView = require('./batchdescriptor');
                    let batchDescriptorView = new BatchDescriptorView({
                        model: batchLayout.model,
                        layoutData: data,
                        descriptorCollection: view.descriptorCollection

                    });
                    batchLayout.showChildView('descriptors', batchDescriptorView);
                });

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
            let columns = window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'accession.batch'}
            });

            // parents batches tab
            let BatchCollection = require('../../collections/batch');
            let parentBatches = new BatchCollection([], {batch_id: this.model.get('id'), batch_type: 'parents'});

            columns.then(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let BatchListView = require('./batchlist');
                let batchListView = new BatchListView({
                    collection: parentBatches,
                    model: batchLayout.model,
                    accessionId: batchLayout.model.get('accession'),
                    columns: data[0].value
                });

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                batchLayout.showChildView('parents', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', batchListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                    targetView: batchListView,
                    collection: parentBatches
                }));

                contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                    collection: parentBatches,
                    columns: data[0].value
                }));
            });

            // children batches tab
            let childrenBatches = new BatchCollection([], {batch_id: this.model.get('id'), batch_type: 'children'});

            columns.then(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let BatchChildrenListView = require('./batchchildrenlist');
                let batchChildrenListView = new BatchChildrenListView({
                    collection: childrenBatches,
                    accessionId: batchLayout.model.get('accession'),
                    model: batchLayout.model,
                    columns: data[0].columns
                });

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                batchLayout.showChildView('batches', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', batchChildrenListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                    targetView: batchChildrenListView,
                    collection: childrenBatches
                }));

                contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                    collection: childrenBatches,
                    columns: data[0].value
                }));
            });

            // panels tab
            let PanelCollection = require('../../collections/batchpanel');
            let batchPanels = new PanelCollection({batch_id: this.model.get('id')});

            // get available columns
            window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'accession.batchpanel'}
            }).then(function (data) {
                if (!batchLayout.isRendered()) {
                    return;
                }

                let BatchPanelListView = require('./batchpanellist');
                let batchPanelListView = new BatchPanelListView({
                    collection: batchPanels,
                    accessionId: batchLayout.model.get('accession'),
                    model: batchLayout.model,
                    columns: data[0].value
                });

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                batchLayout.showChildView('panels', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', batchPanelListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                    targetView: batchPanelListView,
                    collection: batchPanels
                }));

                contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                    collection: batchPanels,
                    columns: data[0].value
                }));
            });

            let accession = new AccessionModel({id: this.model.get('accession')});
            accession.fetch().then(function () {
                if (!batchLayout.isRendered()) {
                    return;
                }

                // batch path
                let BatchPath = require('./batchpath');
                let batchPath = new BatchPath({accession: accession, model: batchLayout.model});

                batchLayout.showChildView('details', batchPath);

                // actions list tab
                let ActionCollection = require('../../collections/action');
                let actions = new ActionCollection({batch_id: batchLayout.model.get('id')});

                // get available columns
                window.application.main.cache.lookup({
                    type: 'entity_columns',
                    format: {model: 'accession.action'}
                }).then(function (data) {
                    if (!batchLayout.isRendered()) {
                        return;
                    }

                    let ActionListView = require('../action/actionlist');
                    let actionListView = new ActionListView({
                        collection: actions, model: batchLayout.model, columns: data[0].value
                    });

                    let contentBottomFooterLayout = new ContentBottomFooterLayout();
                    batchLayout.showChildView('actions', contentBottomFooterLayout);

                    contentBottomFooterLayout.showChildView('content', actionListView);
                    contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                        targetView: actionListView,
                        collection: actions
                    }));

                    contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                        collection: actions,
                        columns: data[0].value
                    }));
                });
            });

            this.onLayoutChange(this.model, this.model.get('layout'));

            // comments
            let CommentListView = require('../../../descriptor/views/commentlist');

            // classifications entry tab (query on show tab)
            let CommentCollection = require('../../../descriptor/collections/comment');
            let comments = new CommentCollection([], {entity: this.model});

            let commentListView = new CommentListView({entity: this.model, collection: comments});
            batchLayout.showChildView('comments', commentListView);

            this.enableTabs();
        } else {
            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'layout', this.model.get('layout')]),
                dataType: 'json'
            }).done(function (data) {
                let view = this;

                this.descriptorCollection = new DescriptorCollection([], {
                    model_id: data.id
                });
                this.descriptorCollection.fetch().then(function () {
                    if (!batchLayout.isRendered()) {
                        return;
                    }

                    // let AccessionDescriptorView = require('./accessiondescriptor');
                    let batchDescriptorView = new BatchDescriptorEditView({
                        model: batchLayout.model,
                        layoutData: data,
                        descriptorCollection: view.descriptorCollection

                    });
                    batchLayout.showChildView('descriptors', batchDescriptorView);
                });
            });

            // not available tabs
            this.disableParentsTab();
            this.disableBatchesTab();
            this.disableActionsTab();
            this.disableCommentsTab();
        }
    }
});

module.exports = Layout;
