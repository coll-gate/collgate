/**
 * @file taxon.js
 * @brief Taxon item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var TaxonItemView = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'object taxon element',
    attributes: {
        'scope': 'row'
    },
    template: require('../templates/taxon.html'),

    ui: {
        "taxon": "td.view-taxon-details",
        "remove_taxon": ".remove-taxon",
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "taxon_synonym_type": ".taxon-synonym-types",
        "taxon_rank": ".taxon-rank",
        "parent": ".parent"
    },

    events: {
        "click @ui.taxon": "onTaxonDetails",
        "click @ui.parent": "onParentTaxonDetails",
        "click @ui.remove_taxon": "onRemoveTaxon"
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                manage: {display: true, event: 'onTaxonDetails'},
                remove: {display: true, event: 'onRemoveTaxon'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        var properties = {
            manage: {disabled: false},
            remove: {disabled: false}
        };

        // @todo manage permissions

        if (/*!this.model.get('can_delete') ||*/0) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    onRender: function() {
        application.main.views.languages.htmlFromValue(this.el);
        application.classification.views.taxonSynonymTypes.htmlFromValue(this.el);

        application.classification.views.taxonRanks.elHtmlFromValue(this.ui.taxon_rank);
        application.classification.views.taxonRanks.elAttributeFromValue(this.ui.parent, "title");
    },

    onTaxonDetails: function() {
        Backbone.history.navigate("app/classification/taxon/" + this.model.get('id') + "/", {trigger: true});
    },

    onParentTaxonDetails: function() {
        if (this.model.get('parent')) {
            Backbone.history.navigate("app/classification/taxon/" + this.model.get('parent') + "/", {trigger: true});
        }
    },

    onRemoveTaxon: function() {
        this.model.destroy({wait: true}).then(function() {
            $.alert.success(gt.gettext("Successfully removed !"));
        });
    }
});

module.exports = TaxonItemView;
