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
    attributes: function() {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require("../../descriptor/templates/entity.html"),

    templateHelpers/*templateContext*/: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

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
        // application.classification.views.taxonSynonymTypes.htmlFromValue(this.el);
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
    },

    rankCell: function(td) {
        var rank = this.model.get('rank');
        var text = application.classification.collections.taxonRanks.findLabel(rank);

        td.html(text);
    },

    parentCell: function(td) {
        var parent_name = this.model.get('parent_details').name || "";
        var parent_rank = this.model.get('parent_details').rank;

        var el = $('<span class="parent taxon-rank" title="">' + parent_name + '</span>');
        if (parent_rank) {
            var rank = application.classification.collections.taxonRanks.findLabel(this.model.get('parent_details').rank);

            el.attr('value', this.model.get('parent_details').rank);
            el.attr('title', rank);
        }

        td.html(el);
    },

    synonymCell: function(td) {
        var synonyms = this.model.get('synonyms');

        if (synonyms.length > 1) {
            var text = this.model.get('synonyms')[1].name;

            td.html(text);
        }
    }
});

module.exports = TaxonItemView;
