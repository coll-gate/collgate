/**
 * @file accessionlayout.js
 * @brief Optimized layout for accession details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-16
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let LayoutView = require('../../../main/views/layout');
let ClassificationEntryModel = require('../../../classification/models/classificationentry');

let ScrollingMoreView = require('../../../main/views/scrollingmore');
let ContentBottomLayout = require('../../../main/views/contentbottomlayout');
let ContentBottomFooterLayout = require('../../../main/views/contentbottomfooterlayout');
let EntityPathView = require('../../../classification/views/entitypath');
let AccessionDescriptorEditView = require('./accessiondescriptoredit');
let EntityListFilterView = require('../../../descriptor/views/entitylistfilter');
let DescriptorCollection = require('../../../descriptor/collections/layoutdescriptor');

let Layout = LayoutView.extend({
    template: require("../../templates/accessionlayout.html"),

    ui: {
        synonyms_tab: 'a[aria-controls=synonyms]',
        batches_tab: 'a[aria-controls=batches]',
        classifications_entries_tab: 'a[aria-controls=classifications-entries]',
        panels_tab: 'a[aria-controls=panels]',
        comments_tab: 'a[aria-controls=comments]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'synonyms': "div.tab-pane[name=synonyms]",
        'batches': "div.tab-pane[name=batches]",
        'classifications-entries': "div.tab-pane[name=classifications-entries]",
        'panels': "div.tab-pane[name=panels]",
        'comments': "div.tab-pane[name=comments]"
    },

    initialize: function (options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:layout', this.onLayoutChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onAccessionCreate, this);
        }
    },

    onAccessionCreate: function (model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/accession/accession/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },

    disableSynonymsTab: function () {
        this.ui.synonyms_tab.parent().addClass('disabled');
    },

    disableBatchesTab: function () {
        this.ui.batches_tab.parent().addClass('disabled');
    },

    disableClassificationsEntriesTab: function () {
        this.ui.classifications_entries_tab.parent().addClass('disabled');
    },

    disablePanelsTab: function () {
        this.ui.panels_tab.parent().addClass('disabled');
    },

    disableCommentsTab: function () {
        this.ui.comments_tab.parent().addClass('disabled');
    },

    enableTabs: function () {
        this.ui.synonyms_tab.parent().removeClass('disabled');
        this.ui.batches_tab.parent().removeClass('disabled');
        this.ui.classifications_entries_tab.parent().removeClass('disabled');
        this.ui.panels_tab.parent().removeClass('disabled');
        this.ui.comments_tab.parent().removeClass('disabled');
    },

    onLayoutChange: function (model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            let accessionLayout = this;

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
                    if (!accessionLayout.isRendered()) {
                        return;
                    }

                    let AccessionDescriptorView = require('./accessiondescriptor');
                    let accessionDescriptorView = new AccessionDescriptorView({
                        model: model,
                        layoutData: data,
                        descriptorCollection: view.descriptorCollection

                    });
                    accessionLayout.showChildView('descriptors', accessionDescriptorView);
                });
            });
        }
    },

    onRender: function () {
        let accessionLayout = this;

        // details view
        if (!this.model.isNew()) {
            // classificationEntry parent
            let classificationEntry = new ClassificationEntryModel({id: this.model.get('primary_classification_entry')});
            classificationEntry.fetch().then(function () {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                accessionLayout.showChildView('details', new EntityPathView({
                    model: accessionLayout.model,
                    classificationEntry: classificationEntry
                }));
            });

            // synonyms tab
            let AccessionSynonymsView = require('./accessionsynonyms');
            accessionLayout.showChildView('synonyms', new AccessionSynonymsView({model: this.model}));

            // batches tab
            let BatchCollection = require('../../collections/batch');
            let accessionBatches = new BatchCollection([], {accession_id: this.model.get('id')});

            // get available columns
            let columns1 = window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'accession.batch'}
            });

            $.when(columns1, accessionBatches.fetch()).then(function (data) {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                let BatchListView = require('../batch/batchlist');
                let batchListView  = new BatchListView({
                    collection: accessionBatches,
                    model: accessionLayout.model,
                    accessionId: accessionLayout.model.get('id'),
                    columns: data[0].value
                });

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                accessionLayout.showChildView('batches', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', batchListView);
                contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                    targetView: batchListView,
                    collection: accessionBatches
                }));

                contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                    collection: accessionBatches,
                    columns: data[0].value
                }));
            });

            // classifications entry tab
            let AccessionClassificationEntryCollection = require('../../collections/accessionclassificationentry');
            let accessionClassificationEntries = new AccessionClassificationEntryCollection([], {accession_id: this.model.get('id')});

            // get available columns
            let columns2 = window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'classification.classificationentry'}
            });

            $.when(columns2, accessionClassificationEntries.fetch()).then(function (data) {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                let AccessionClassificationEntryListView = require('./accessionclassificationentries');
                let accessionClassificationEntryListView = new AccessionClassificationEntryListView({
                    collection: accessionClassificationEntries, model: accessionLayout.model, columns: data[0].value
                });

                let contentBottomFooterLayout = new ContentBottomFooterLayout();
                accessionLayout.showChildView('classifications-entries', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', accessionClassificationEntryListView);
                // contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({targetView: accessionClassificationEntryListView}));

                let AccessionClassificationEntryAdd = require('./accessionclassificationentryadd');
                contentBottomFooterLayout.showChildView('footer', new AccessionClassificationEntryAdd({collection: accessionClassificationEntries}));
            });

            // panels tab
            let PanelCollection = require('../../collections/accessionpanel');
            let accessionPanels = new PanelCollection({accession_id: this.model.get('id')});

            // get available columns
            let columns3 = window.application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'accession.accessionpanel'}
            });

            $.when(columns3, accessionPanels.fetch()).then(function (data) {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                let AccessionPanelListView = require('./accessionpanellist');
                let accessionPanelListView = new AccessionPanelListView({
                    collection: accessionPanels, model: accessionLayout.model, columns: data[0].value
                });

                let contentBottomLayout = new ContentBottomLayout();
                accessionLayout.showChildView('panels', contentBottomLayout);

                contentBottomLayout.showChildView('content', accessionPanelListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: accessionPanelListView}));

                accessionPanelListView.query();
            });

            this.onLayoutChange(this.model, this.model.get('layout'));

            // comments
            let CommentList = require('../../../descriptor/views/commentlist');
            let commentList = new CommentList({model: this.model});

            accessionLayout.showChildView('comments', commentList);

            this.enableTabs();
        } else {
            // details
            let classificationEntry = new ClassificationEntryModel({id: this.model.get('primary_classification_entry')});
            classificationEntry.fetch().then(function () {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                accessionLayout.showChildView('details', new EntityPathView({
                    model: accessionLayout.model, classificationEntry: classificationEntry, noLink: true
                }));
            });

            let model = this.model;

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
                    if (!accessionLayout.isRendered()) {
                        return;
                    }

                    // let AccessionDescriptorView = require('./accessiondescriptor');
                    let accessionDescriptorView = new AccessionDescriptorEditView({
                        model: model,
                        layoutData: data,
                        descriptorCollection: view.descriptorCollection

                    });
                    accessionLayout.showChildView('descriptors', accessionDescriptorView);
                });
            });

            // not available tabs
            this.disableSynonymsTab();
            this.disableBatchesTab();
            this.disableClassificationsEntriesTab();
            this.disablePanelsTab();
            this.disableCommentsTab();
        }
    }
});

module.exports = Layout;
