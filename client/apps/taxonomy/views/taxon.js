/**
 * @file taxon.js
 * @brief Taxon item view
 * @author Frederic SCHERMA
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../models/taxon');

var TaxonItemView = Marionette.ItemView.extend({
    tagName: 'div',
    template: require('../templates/taxon.html'),

    ui: {
        "taxon": "span.taxon",
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "taxon_synonym_type": ".taxon-synonym-types",
        "taxon_rank": ".taxon-ranks",
    },

    events: {
        "click @ui.taxon": "onTaxonDetails"
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        application.main.views.languages.htmlFromValue(this.el);
        application.taxonomy.views.taxonSynonymTypes.htmlFromValue(this.el);
        application.taxonomy.views.taxonRanks.htmlFromValue(this.el);
    },

    onTaxonDetails: function() {
        Backbone.history.navigate("app/taxonomy/" + this.model.get('id') + "/", {trigger: true});
    }
});

module.exports = TaxonItemView;
