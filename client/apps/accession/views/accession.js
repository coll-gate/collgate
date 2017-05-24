/**
 * @file accession.js
 * @brief Accession item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'object accession element',
    attributes: function() {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require('../templates/accession.html'),

    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.getOption('columns')
        }
    },

    ui: {
        details: 'td.view-accession-details',
        parent: 'td.view-parent-details'
    },

    events: {
        'click @ui.details': 'viewDetails',
        'click @ui.parent': 'viewParent'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    viewDetails: function () {
        Backbone.history.navigate('app/accession/accession/' + this.model.get('id') + '/', {trigger: true});
    },

    viewParent: function () {
        Backbone.history.navigate('app/classification/taxon/' + this.model.get('parent') + '/', {trigger: true});
    },

    parentCell: function(td) {
        var el = $('<span class="parent taxon-rank" title="">' + this.model.get('parent_details').name + '</span>');
        var rank = application.classification.collections.taxonRanks.findLabel(this.model.get('parent_details').rank);

        el.attr('value', this.model.get('parent_details').rank);
        el.attr('title', rank);

        td.html(el);
    }
});

module.exports = View;
