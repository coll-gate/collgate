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
var EntityPathView = require('../../taxonomy/views/entitypath');
var AccessionDescriptorEditView = require('../views/accessiondescriptoredit');


var Layout = Marionette.LayoutView.extend({
    template: require("../templates/accessionlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        tabs: 'a[data-toggle="tab"]',
        active_pane: 'div.tab-pane.active',
        synonyms_tab: 'a[aria-controls=synonyms]',
        batches_tab: 'a[aria-controls=batches]'
    },

    regions: {
        'details': "div[name=details]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'synonyms': "div.tab-pane[name=synonyms]",
        'batches': "div.tab-pane[name=batches]"
    },

    childEvents: {
        'dom:refresh': function(child) {
            var tab = this.ui.active_pane.attr('name');
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

        this.activeTab = "descriptors";

        this.listenTo(this.model, 'change:descriptor_meta_model', this.onDescriptorMetaModelChange, this);
    },

    disableSynonymsTab: function () {
        this.ui.synonyms_tab.parent().addClass('disabled');
    },

    disableBatchesTab: function () {
        this.ui.batches_tab.parent().addClass('disabled');
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

        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideTab, this));

        // details view
        if (!this.model.isNew()) {
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
        } else {
            var taxon = new TaxonModel({id: this.model.get('parent')});
            taxon.fetch().then(function() {
                accessionLayout.getRegion('details').show(new EntityPathView({
                    model: accessionLayout.model, taxon: taxon, noLink: true}));
            });

            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + this.model.get('descriptor_meta_model') + '/layout/',
                dataType: 'json'
            }).done(function(data) {
                var accessionDescriptorView = new AccessionDescriptorEditView({
                    model: accessionLayout.model, descriptorMetaModelLayout: data});

                accessionLayout.getRegion('descriptors').show(accessionDescriptorView);
            });

            this.disableSynonymsTab();
            this.disableBatchesTab();
        }
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
