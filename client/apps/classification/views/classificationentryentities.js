/**
 * @file classificationentryentities.js
 * @brief Classification entry entities list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let ClassificationEntryEntityView = require('./classificationentryentity');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/classificationentryentitieslist.html"),
    className: "classification-entry-entity-list advanced-table-container",
    childView: ClassificationEntryEntityView,
    childViewContainer: 'tbody.entities-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
