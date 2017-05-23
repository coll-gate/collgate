/**
 * @file taxonentities.js
 * @brief Taxon entities list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var TaxonEntityView = require('../views/taxonentity');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/taxonentitieslist.html"),
    className: "taxon-entity-list advanced-table-container",
    childView: TaxonEntityView,
    childViewContainer: 'tbody.entities-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
