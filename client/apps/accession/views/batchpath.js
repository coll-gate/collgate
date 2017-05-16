/**
 * @file batchpath.js
 * @brief Accession + batch name item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

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

    onViewAccession: function(e) {
        if (this.getOption('noLink')) {
            return;
        }

        var accession_id = $(e.target).data('accession-id');
        Backbone.history.navigate("app/accession/accession/" + accession_id + "/", {trigger: true});
    }
});

module.exports = View;
