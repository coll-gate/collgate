/**
 * @file taxonentities.js
 * @brief Taxon entities list view
 * @author Frederic SCHERMA
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var TaxonEntityView = require('../views/taxonentity');
var ScrollView = require('../../main/views/scroll');


var View = ScrollView.extend({
    template: require("../templates/taxonentitieslist.html"),
    className: "taxon-entity-list advanced-table-container",
    childView: TaxonEntityView,
    childViewContainer: 'tbody.entities-list',

    initialize: function(options) {
        options || (options = {});

        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
