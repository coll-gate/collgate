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
    className: "taxon-entity-list",
    childView: TaxonEntityView,
    childViewContainer: 'tbody.entities-list',

    initialize: function(options) {
        options || (options = {});

        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo($('window'), 'load', this.resize, this);
        this.listenTo($('window'), 'resize', this.resize, this);
    }
});

module.exports = View;
