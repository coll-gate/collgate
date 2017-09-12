/**
 * @file panellayout.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var LayoutView = require('../../main/views/layout');
var ClassificationEntryModel = require('../../classification/models/classificationentry');

var ScrollingMoreView = require('../../main/views/scrollingmore');
var ContentBottomLayout = require('../../main/views/contentbottomlayout');
var EntityPathView = require('../../classification/views/entitypath');

var Layout = LayoutView.extend({
    template: require("../templates/panellayout.html"),

    ui: {
        synonyms_tab: 'a[aria-controls=synonyms]',
        batches_tab: 'a[aria-controls=batches]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'synonyms': "div.tab-pane[name=synonyms]",
        'batches': "div.tab-pane[name=batches]"
    },

    initialize: function(options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:descriptor_meta_model', this.onDescriptorMetaModelChange, this);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onPanelCreate, this);
        }
    },

    onPanelCreate: function(model, value) {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/accession/panel/' + this.model.get('id') + '/', {/*trigger: true,*/ replace: false});
    },

    disableSynonymsTab: function () {
        this.ui.synonyms_tab.parent().addClass('disabled');
    },

    disableBatchesTab: function () {
        this.ui.batches_tab.parent().addClass('disabled');
    },

    enableTabs: function() {
        this.ui.synonyms_tab.parent().removeClass('disabled');
        this.ui.batches_tab.parent().removeClass('disabled');
    },

    onDescriptorMetaModelChange: function(model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            var panelLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + value + '/layout/',
                dataType: 'json'
            }).done(function (data) {
                var PanelDescriptorView = require('../views/paneldescriptor');
                var panelDescriptorView = new PanelDescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });
                panelLayout.showChildView('descriptors', panelDescriptorView);
            });
        }
    },

    onRender: function() {
        var panelLayout = this;

        // details view
        if (!this.model.isNew()) {
            // classificationEntry parent
            var classificationEntry = new ClassificationEntryModel({id: this.model.get('primary_classification_entry')});
            classificationEntry.fetch().then(function () {
                panelLayout.showChildView('details', new EntityPathView({
                    model: panelLayout.model,
                    classificationEntry: classificationEntry
                }));
            });

            // synonyms tab
            var PanelSynonymsView = require('../views/panelsynonyms');
            panelLayout.showChildView('synonyms', new PanelSynonymsView({model: this.model}));

            // batches tab
            var BatchCollection = require('../collections/batch');
            var panelBatches = new BatchCollection([], {panel_id: this.model.get('id')});

            // get available columns
            var columns = $.ajax({
                type: "GET",
                url: application.baseUrl + 'descriptor/columns/panel.accession/',
                contentType: "application/json; charset=utf-8"
            });

            $.when(columns, panelBatches.fetch()).done(function (data) {
                var BatchListView = require('../views/batchlist');
                var batchListView  = new BatchListView({
                    collection: panelBatches, model: accessionLayout.model, columns: data[0].columns});

                var contentBottomLayout = new ContentBottomLayout();
                accessionLayout.showChildView('batches', contentBottomLayout);

                contentBottomLayout.showChildView('content', batchListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: batchListView}));
            });

            this.onDescriptorMetaModelChange(this.model, this.model.get('descriptor_meta_model'));
            this.enableTabs();
        } else {
            // details
            var classificationEntry = new ClassificationEntryModel({id: this.model.get('primary_classification_entry')});
            classificationEntry.fetch().then(function() {
                accessionLayout.showChildView('details', new EntityPathView({
                    model: accessionLayout.model, classificationEntry: classificationEntry, noLink: true}));
            });

            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + this.model.get('descriptor_meta_model') + '/layout/',
                dataType: 'json'
            }).done(function(data) {
                var accessionDescriptorView = new AccessionDescriptorEditView({
                    model: accessionLayout.model, descriptorMetaModelLayout: data});

                accessionLayout.showChildView('descriptors', accessionDescriptorView);
            });

            // not available tabs
            this.disableSynonymsTab();
            this.disableBatchesTab();
        }
    }
});

// module.exports = Layout;
