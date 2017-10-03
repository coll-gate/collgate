/**
 * @file entitysynonymtypelist.js
 * @brief Entity synonym type list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var EntitySynonymView = require('../views/entitysynonymtype');
var AdvancedTable = require('./advancedtable');

var View = AdvancedTable.extend({
    template: require("../templates/entitysynonymtypelist.html"),
    className: "entity-synonym-type-list advanced-table-container",
    childView: EntitySynonymView,
    childViewContainer: 'tbody.entity-synonym-type-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
