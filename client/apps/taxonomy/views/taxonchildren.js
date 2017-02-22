/**
 * @file taxonchildren.js
 * @brief Taxon list view
 * @author Frederic SCHERMA
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../models/taxon');
var TaxonView = require('../views/taxon');

var ScrollView = require('../../main/views/scroll');


var View = ScrollView.extend({
    template: "<div></div>",
    className: "taxon-list",
    childView: TaxonView,
    attributes: {
    },

    initialize: function(options) {
        options || (options = {});

        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
