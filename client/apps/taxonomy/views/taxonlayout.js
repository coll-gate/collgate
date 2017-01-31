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

var Layout = Marionette.LayoutView.extend({
    template: require("../templates/taxonlayout.html"),

    regions: {
        'details': "#taxon_details",
        'synonyms': "#taxon_synonyms",
        'descriptors': "#taxon_descriptors",
        'children-content': "#taxon_children > div.children-content",
        'children-bottom': "#taxon_children > div.children-bottom",
        'entities-content': "#taxon_entities > div.entities-content",
        'entities-bottom': "#taxon_entities > div.entities-bottom"
    },

    ui: {
        'tabs': 'a[data-toggle="tab"]'
    },

    initialize: function(model, options) {
        Layout.__super__.initialize.apply(arguments);

        this.listenTo(this.model, 'change', this.onTaxonChange, this);
        this.listenTo(this.model, 'change:descriptor_meta_model', this.onTaxonDescriptorMetaModelChange, this);
    },

    onTaxonChange: function() {

    },

    onTaxonDescriptorMetaModelChange: function(model, value) {
        if (value == null) {
            // @todo if was on taxondescriptor view, now taxondescriptorcreate view
        } else {
            // @todo if was on taxondescriptorcreate view, now taxondescriptor view
        }
    },

    onRender: function() {
        this.ui.tabs.on("shown.bs.tab", $.proxy(this.onShowTab, this));
        this.ui.tabs.on("hide.bs.tab", $.proxy(this.onHideTab, this));
    },

    onShowTab: function(e) {
        // e.target current tab, e.relatedTarget previous tab
        var tab = e.target.getAttribute('aria-controls');

        if (tab === "descriptors") {
            if (this.getRegion('descriptors').currentView.onShowTab) {
                this.getRegion('descriptors').currentView.onShowTab();
            }
        }
    },

    onHideTab: function(e) {
        var tab = e.target.getAttribute('aria-controls');

        if (tab === "descriptors") {
            if (this.getRegion('descriptors').currentView.onHideTab) {
                this.getRegion('descriptors').currentView.onHideTab();
            }
        }

        application.main.defaultRightView();
    },

    onDestroy: function() {
        application.main.defaultRightView();
    }
});

module.exports = Layout;
