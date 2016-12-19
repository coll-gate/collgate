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
        var entity = this.entity;
        return {
            entity_name: entity ? entity.get('name') : ""
        };
    },

    noLink: false,
    entity: null,

    ui: {
        view_taxon: ".view-taxon",
        taxon_rank: ".taxon-ranks"
    },

    events: {
        'click @ui.view_taxon': 'onViewTaxon',
    },

    initialize: function(options) {
        this.mergeOptions(options, ['entity']);

        this.listenTo(this.model, 'reset', this.render, this);
        this.listenTo(this.entity, 'change', this.render, this);
    },

    onRender: function() {
        application.taxonomy.views.taxonRanks.htmlFromValue(this.el);

        if (this.getOption('noLink')) {
            this.ui.view_taxon.removeClass('action');
        }
    },

    onViewTaxon: function(e) {
        if (this.getOption('noLink')) {
            return;
        }

        var taxon_id = $(e.target).data('taxon-id');
        Backbone.history.navigate("app/taxonomy/taxon/" + taxon_id + "/", {trigger: true});
    },
});

module.exports = View;
