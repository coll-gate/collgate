/**
 * @file batchpath.js
 * @brief Accession + batch name item view
 * @author Frederic SCHERMA
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var AccessionModel = require('../models/accession');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    template: require('../templates/batchpath.html'),
    templateHelpers/*templateContext*/: function () {
        return {
            accession: this.accession
        };
    },

    accession: {name: ''},
    noLink: false,

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        view_accession: ".view-accession"
    },

    events: {
        'click @ui.view_accession': 'onViewAccession'
    },

    initialize: function(options) {
        this.mergeOptions(options, ['accession']);

        this.listenTo(this.model, 'change:name', this.render, this);
    },

    onRender: function() {
        if (this.getOption('noLink')) {
            this.ui.view_accession.removeClass('action');
        }
    },

    onViewTaxon: function(e) {
        if (this.getOption('noLink')) {
            return;
        }

        var accession_id = $(e.target).data('accession-id');
        Backbone.history.navigate("app/accession/accession/" + accession_id + "/", {trigger: true});
    }
});

module.exports = View;
