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
var EntityPathView = require('../../classification/views/entitypath');
var AccessionDescriptorEditView = require('../views/accessiondescriptoredit');

var Layout = LayoutView.extend({
    template: require("../templates/accessionlayout.html"),

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

    enableTabs: function() {
        this.ui.synonyms_tab.parent().removeClass('disabled');
        this.ui.batches_tab.parent().removeClass('disabled');
    },

    onDescriptorMetaModelChange: function(model, value) {
        if (value == null) {
            this.getRegion('descriptors').empty();
        } else {
            var accessionLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + value + '/layout/',
                dataType: 'json'
            }).done(function (data) {
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
            var columns = $.ajax({
                type: "GET",
                url: application.baseUrl + 'descriptor/columns/accession.batch/',
                contentType: "application/json; charset=utf-8"
            });

            columns.done(function (data) {
                var BatchListView = require('../views/batchlist');
                var batchListView  = new BatchListView({
                    collection: accessionBatches, model: accessionLayout.model, columns: data.columns});

                var contentBottomLayout = new ContentBottomLayout();
                accessionLayout.showChildView('batches', contentBottomLayout);

                contentBottomLayout.showChildView('content', batchListView);
                contentBottomLayout.showChildView('bottom', new ScrollingMoreView({targetView: batchListView}));

                batchListView.query();
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

module.exports = Layout;
