/**
 * @file taxonlist.js
 * @brief Taxon list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var TaxonView = require('../views/taxon');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/taxonlist.html"),
    className: "taxon-list advanced-table-container",
    childView: TaxonView,
    childViewContainer: 'tbody.taxon-list',
    userSettingName: '_taxon_list_columns',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
