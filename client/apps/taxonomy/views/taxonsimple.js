/**
 * @file taxonsimple.js
 * @brief Taxon simple item view
 * @author Frederic SCHERMA
 * @date 2016-12-15
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    template: require('../templates/taxonsimple.html'),
    templateHelpers: function () {
        return {
            entity_name: this.entity_name,
        };
    },

    ui: {
        //"taxon": "span.taxon",
        "taxon_rank": ".taxon-ranks"
    },

    initialize: function(options) {
        this.listenTo(this.model, 'reset', this.render, this);
        if (options.entity && options.entity.get('name')) {
            this.entity_name = options.entity.get('name');
        } else {
            this.entity_name = "";
        }
    },

    onRender: function() {
        application.taxonomy.views.taxonRanks.htmlFromValue(this.el);
    },
});

module.exports = View;
