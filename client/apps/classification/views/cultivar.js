/**
 * @file cultivar.js
 * @brief Cultivar item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'object taxon cultivar element',
    attributes: {
        'scope': 'row'
    },
    template: require('../templates/cultivar.html'),

    ui: {
        "cultivar": "td.view-cultivar-details",
        "remove_cultivar": ".remove-cultivar",
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "cultivar_synonym_type": ".cultivar-synonym-types",
        "parent": ".parent"
    },

    events: {
        "click @ui.cultivar": "onCultivarDetails",
        "click @ui.parent": "onParentCultivarDetails",
        "click @ui.remove_cultivar": "onRemoveCultivar"
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.languages.htmlFromValue(this.el);
        application.classification.views.taxonSynonymTypes.htmlFromValue(this.el);

        application.classification.views.taxonRanks.elAttributeFromValue(this.ui.parent, "title");
    },

    onCultivarDetails: function() {
        Backbone.history.navigate("app/classification/taxon/" + this.model.get('id') + "/", {trigger: true});
    },

    onParentCultivarDetails: function() {
        if (this.model.get('parent')) {
            Backbone.history.navigate("app/classification/taxon/" + this.model.get('parent') + "/", {trigger: true});
        }
    },

    onRemoveCultivar: function() {
        this.model.destroy({wait: true}).then(function() {
            $.alert.success(gt.gettext("Successfully removed !"));
        });
    }
});

module.exports = View;
