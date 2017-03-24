/**
 * @file accessionlayout.js
 * @brief Optimized layout for accession details
 * @author Frederic SCHERMA
 * @date 2017-01-16
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../../taxonomy/models/taxon');

var ScrollingMoreView = require('../../main/views/scrollingmore');
var ContentBottomLayout = require('../../main/views/contentbottomlayout');
var EntityPathView = require('../../taxonomy/views/entitypath');
var AccessionDescriptorEditView = require('../views/accessiondescriptoredit');


var Layout = Marionette.LayoutView.extend({
    template: require("../templates/accessionlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        tabs: 'a[data-toggle="tab"]',
        initial_pane: 'div.tab-pane.active',
        synonyms_tab: 'a[aria-controls=synonyms]',
        batches_tab: 'a[aria-controls=batches]',
        actions_tab: 'a[aria-controls=actions]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'synonyms': "div.tab-pane[name=synonyms]",
        'batches': "div.tab-pane[name=batches]",
        'actions': "div.tab-pane[name=actions]"
    },

    childEvents: {
        'dom:refresh': function(child) {
            var tab = this.$el.find('div.tab-pane.active').attr('name');
            var region = this.getRegion(tab);

            // update child of current tab
            if (region && child && region.currentView == child) {
                if (region.currentView.onShowTab) {
                    region.currentView.onShowTab(this);
                }
            }
        }
    },

    initialize: function(model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.activeTab = undefined;

        this.listenTo(this.model, 'change:descriptor_meta_model', this.onDescriptorMetaModelChange, this);
        this.listenTo(this.model, 'change:id', this.onAccessionCreate, this);
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

    disableActionTab: function () {
        this.ui.actions_tab.parent().addClass('disabled');
    },

    enableTabs: function() {
        this.ui.synonyms_tab.parent().removeClass('disabled');
        this.ui.batches_tab.parent().removeClass('disabled');
        this.ui.actions_tab.parent().removeClass('disabled');
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
                accessionLayout.getRegion('descriptors').show(accessionDescriptorView);
            });
        }
    },

    onRender: function() {
        var accessionLayout = this;

        // details view
        if (!this.model.isNew()) {
            // taxon parent
            var taxon = new TaxonModel({id: this.model.get('parent')});
            taxon.fetch().then(function () {
                accessionLayout.getRegion('details').show(new EntityPathView({
                    model: accessionLayout.model,
                    taxon: taxon
                }));
            });

            // synonyms tab
            var AccessionSynonymsView = require('../views/accessionsynonyms');
            accessionLayout.getRegion('synonyms').show(new AccessionSynonymsView({model: this.model}));

            // batches tab
            var BatchCollection = require('../collections/batch');
            var accessionBatches = new BatchCollection([], {accession_id: this.model.get('id')});

            accessionBatches.fetch().then(function() {
                var BatchListView = require('../views/batchlist');
                var batchListView  = new BatchListView({collection: accessionBatches, model: accessionLayout.model});

                var contentBottomLayout = new ContentBottomLayout();
                accessionLayout.getRegion('batches').show(contentBottomLayout);

                contentBottomLayout.getRegion('content').show(batchListView);
                contentBottomLayout.getRegion('bottom').show(new ScrollingMoreView({targetView: batchListView}));
            });

            this.onDescriptorMetaModelChange(this.model, this.model.get('descriptor_meta_model'));
            this.enableTabs();
        } else {
            // details
            var taxon = new TaxonModel({id: this.model.get('parent')});
            taxon.fetch().then(function() {
                accessionLayout.getRegion('details').show(new EntityPathView({
                    model: accessionLayout.model, taxon: taxon, noLink: true}));
            });

            // descriptors edit tab
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + this.model.get('descriptor_meta_model') + '/layout/',
                dataType: 'json'
            }).done(function(data) {
                var accessionDescriptorView = new AccessionDescriptorEditView({
                    model: accessionLayout.model, descriptorMetaModelLayout: data});

                accessionLayout.getRegion('descriptors').show(accessionDescriptorView);
            });

            // not available tabs
            this.disableSynonymsTab();
            this.disableBatchesTab();
            this.disableActionTab();
        }
    },

    onBeforeAttach: function() {
        this.activeTab = this.ui.initial_pane.attr('name');

        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideTab, this));
    },

    onShowTab: function(e) {
        // e.target current tab, e.relatedTarget previous tab
        var tab = e.target.getAttribute('aria-controls');
        this.activeTab = tab;

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onShowTab) {
            region.currentView.onShowTab(this);
        }
    },

    onHideTab: function(e) {
        var tab = e.target.getAttribute('aria-controls');

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onHideTab) {
            region.currentView.onHideTab(this);
        }

        application.main.defaultRightView();
    },

    onDestroy: function() {
        application.main.defaultRightView();
    }
});

module.exports = Layout;
