/**
 * @file accessionlayout.js
 * @brief Optimized layout for accession details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-16
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var LayoutView = require('../../main/views/layout');
var ClassificationEntryModel = require('../../classification/models/classificationentry');

var ScrollingMoreView = require('../../main/views/scrollingmore');
var ContentBottomLayout = require('../../main/views/contentbottomlayout');
var ContentBottomFooterLayout = require('../../main/views/contentbottomfooterlayout');
var EntityPathView = require('../../classification/views/entitypath');
var AccessionDescriptorEditView = require('../views/accessiondescriptoredit');

var Layout = LayoutView.extend({
    template: require("../templates/accessionlayout.html"),

    ui: {
        synonyms_tab: 'a[aria-controls=synonyms]',
        batches_tab: 'a[aria-controls=batches]',
        classifications_entries_tab: 'a[aria-controls=classifications-entries]',
        panels_tab: 'a[aria-controls=panels]',
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'synonyms': "div.tab-pane[name=synonyms]",
        'batches': "div.tab-pane[name=batches]",
        'classifications-entries': "div.tab-pane[name=classifications-entries]",
        'panels': "div.tab-pane[name=panels]",
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:descriptor_meta_model', this.onDescriptorMetaModelChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onAccessionCreate, this);
        }
    },

    onAccessionCreate: function(model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/accession/accession/' + this.model.get('id') + '/', {/*trigger: true,*/ replace: false});
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

    enableTabs: function() {
        this.ui.synonyms_tab.parent().removeClass('disabled');
        this.ui.batches_tab.parent().removeClass('disabled');
        this.ui.classifications_entries_tab.parent().removeClass('disabled');
        this.ui.panels_tab.parent().removeClass('disabled');
    },

    onDescriptorMetaModelChange: function(model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            var accessionLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'meta-model', value, 'layout']),
                dataType: 'json'
            }).done(function (data) {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                var AccessionDescriptorView = require('../views/accessiondescriptor');
                var accessionDescriptorView = new AccessionDescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });
                accessionLayout.showChildView('descriptors', accessionDescriptorView);
            });
        }
    },

    onRender: function() {
        var accessionLayout = this;

        // details view
        if (!this.model.isNew()) {
            // classificationEntry parent
            var classificationEntry = new ClassificationEntryModel({id: this.model.get('primary_classification_entry')});
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
            var AccessionSynonymsView = require('../views/accessionsynonyms');
            accessionLayout.showChildView('synonyms', new AccessionSynonymsView({model: this.model}));

            // batches tab
            var BatchCollection = require('../collections/batch');
            var accessionBatches = new BatchCollection([], {accession_id: this.model.get('id')});

            // get available columns
            var columns1 = application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'accession.batch'}
            });

            $.when(columns1, accessionBatches.fetch()).then(function (data) {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                var BatchListView = require('../views/batchlist');
                var batchListView  = new BatchListView({
                    collection: accessionBatches, model: accessionLayout.model, columns: data[0].value});

                var contentBottomLayout = new ContentBottomLayout();
                accessionLayout.showChildView('batches', contentBottomLayout);

                contentBottomLayout.showChildView('content', batchListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: batchListView}));
            });

            // classifications entry tab
            var AccessionClassificationEntryCollection = require('../collections/accessionclassificationentry');
            var accessionClassificationEntries = new AccessionClassificationEntryCollection([], {accession_id: this.model.get('id')});

            // get available columns
            var columns2 = application.main.cache.lookup({
                type: 'entity_columns',
                format: {model: 'classification.classificationentry'}
            });

            $.when(columns2, accessionClassificationEntries.fetch()).then(function (data) {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                var AccessionClassificationEntryListView = require('../views/accessionclassificationentries');
                var accessionClassificationEntryListView  = new AccessionClassificationEntryListView({
                    collection: accessionClassificationEntries, model: accessionLayout.model, columns: data[0].value});

                var contentBottomFooterLayout = new ContentBottomFooterLayout();
                accessionLayout.showChildView('classifications-entries', contentBottomFooterLayout);

                contentBottomFooterLayout.showChildView('content', accessionClassificationEntryListView);
                // contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({targetView: accessionClassificationEntryListView}));

                var AccessionClassificationEntryAdd = require('../views/accessionclassificationentryadd');
                contentBottomFooterLayout.showChildView('footer', new AccessionClassificationEntryAdd({collection: accessionClassificationEntries}));
            });

            this.onDescriptorMetaModelChange(this.model, this.model.get('descriptor_meta_model'));
            this.enableTabs();
        } else {
            // details
            var classificationEntry = new ClassificationEntryModel({id: this.model.get('primary_classification_entry')});
            classificationEntry.fetch().then(function() {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                accessionLayout.showChildView('details', new EntityPathView({
                    model: accessionLayout.model, classificationEntry: classificationEntry, noLink: true}));
            });

            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: window.application.url(['descriptor', 'meta-model', this.model.get('descriptor_meta_model'), 'layout']),
                dataType: 'json'
            }).done(function(data) {
                if (!accessionLayout.isRendered()) {
                    return;
                }

                var accessionDescriptorView = new AccessionDescriptorEditView({
                    model: accessionLayout.model, descriptorMetaModelLayout: data});

                accessionLayout.showChildView('descriptors', accessionDescriptorView);
            });

            // not available tabs
            this.disableSynonymsTab();
            this.disableBatchesTab();
            this.disableClassificationsEntriesTab();
            this.disablePanelsTab();
        }
    }
});

module.exports = Layout;
