/**
 * @file accession.js
 * @brief Accession item view
 * @author Frederic SCHERMA
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'object accession element',
    attributes: {
        'scope': 'row',
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
        // parent rank
        application.taxonomy.views.taxonRanks.attributeFromValue(this.el, "title");
        // and date-time
        // this.ui.datetime.localizeDate(null, session.language);
    },

    viewDetails: function () {
        Backbone.history.navigate('app/accession/accession/' + this.model.get('id') + '/', {trigger: true});
    },

    viewParent: function () {
        Backbone.history.navigate('app/taxonomy/taxon/' + this.model.get('parent') + '/', {trigger: true});
    }
});

module.exports = View;
