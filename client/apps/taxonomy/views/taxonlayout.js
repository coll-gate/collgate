/**
 * @file taxonlayout.js
 * @brief Optimized layout for taxon details
 * @author Frederic SCHERMA
 * @date 2016-12-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var ContentBottomLayout = require('../../main/views/contentbottomlayout');

var Layout = Marionette.LayoutView.extend({
    template: require("../templates/taxonlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'details': "div[name=details]",
        'synonyms': "div.tab-pane[name=synonyms]",
        'descriptors': "div.tab-pane[name=descriptors]",
        'children': 'div.tab-pane[name=children]',
        'entities': "div.tab-pane[name=entities]"
    },

    ui: {
        tabs: 'a[data-toggle="tab"]',
        active_pane: 'div.tab-pane.active'
    },

    initialize: function(model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:descriptor_meta_model', this.onTaxonDescriptorMetaModelChange, this);
    },

    onTaxonDescriptorMetaModelChange: function(model, value) {
        if (value == null) {
            var TaxonDescriptorCreateView = require('../views/taxondescriptorcreate');
            var taxonDescriptorCreateView = new TaxonDescriptorCreateView({model: model});

            this.getRegion('descriptors').show(taxonDescriptorCreateView);

            // manually called
            if (this.activeTab === 'descriptors') {
                taxonDescriptorCreateView.onShowTab();
            }
        } else {
            var taxonLayout = this;

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + value + '/layout/',
                dataType: 'json'
            }).done(function (data) {
                var TaxonDescriptorView = require('../views/taxondescriptor');
                var taxonDescriptorView = new TaxonDescriptorView({
                    model: model,
                    descriptorMetaModelLayout: data
                });
                taxonLayout.getRegion('descriptors').show(taxonDescriptorView);

                // manually called
                if (taxonLayout.activeTab === 'descriptors') {
                    taxonDescriptorView.onShowTab();
                }
            });
        }
    },

    onRender: function() {
        var taxonLayout = this;

        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideTab, this));

        // details views
        var TaxonDetailsView = require('../views/taxondetails');
        this.getRegion('details').show(new TaxonDetailsView({model: this.model}));

        // synonyms tab
        var TaxonSynonymsView = require('../views/taxonsynonyms');
        this.getRegion('synonyms').show(new TaxonSynonymsView({model: this.model}));

        // descriptors tab
        var TaxonDescriptorCreateView = require('../views/taxondescriptorcreate');
        var taxonDescriptorCreateView = new TaxonDescriptorCreateView({model: this.model});
        this.getRegion('descriptors').show(taxonDescriptorCreateView);

        // direct taxon sub-levels tab
        var TaxonChildrenCollection = require('../collections/taxonchildren');
        var taxonChildren = new TaxonChildrenCollection([], {model_id: this.model.id});

        taxonChildren.fetch().then(function() {
            var TaxonChildrenView = require('../views/taxonchildren');
            var taxonChildrenView = new TaxonChildrenView({collection: taxonChildren, model: taxonLayout.model});

            var contentBottomLayout = new ContentBottomLayout();
            taxonLayout.getRegion('children').show(contentBottomLayout);

            contentBottomLayout.getRegion('content').show(taxonChildrenView);
            contentBottomLayout.getRegion('bottom').show(new ScrollingMoreView({targetView: taxonChildrenView}));
        });

        // entities relating this taxon tab
        var TaxonEntitiesCollection = require('../collections/taxonentities');
        var taxonEntities = new TaxonEntitiesCollection([], {model_id: this.model.id});

        taxonEntities.fetch().then(function() {
            var TaxonEntitiesView = require('../views/taxonentities');
            var taxonEntitiesView = new TaxonEntitiesView({collection: taxonEntities, model: taxonLayout.model});

            var contentBottomLayout = new ContentBottomLayout();
            taxonLayout.getRegion('entities').show(contentBottomLayout);

            contentBottomLayout.getRegion('content').show(taxonEntitiesView);
            contentBottomLayout.getRegion('bottom').show(new ScrollingMoreView({targetView: taxonEntitiesView}));
        });
    },

    onShowTab: function(e) {
        // e.target current tab, e.relatedTarget previous tab
        var tab = e.target.getAttribute('aria-controls');
        this.activeTab = tab;

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onShowTab) {
            region.currentView.onShowTab();
        }
    },

    onHideTab: function(e) {
        var tab = e.target.getAttribute('aria-controls');

        var region = this.getRegion(tab);
        if (region && region.currentView && region.currentView.onHideTab) {
            region.currentView.onHideTab();
        }

        application.main.defaultRightView();
    },

    onDestroy: function() {
        application.main.defaultRightView();
    }
});

module.exports = Layout;
