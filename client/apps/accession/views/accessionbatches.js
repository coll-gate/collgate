/**
 * @file accessionbatches.js
 * @brief Accession batches list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let BatchView = require('../views/batch');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../../descriptor/templates/entitylist.html"),
    className: "accession-batch-list",
    childView: BatchView,
    childViewContainer: 'tbody.entity-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
