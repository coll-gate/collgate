/**
 * @file classificationlist.js
 * @brief List of classification view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var ClassificationView = require('../views/classification');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/classificationlist.html"),
    className: "object classification-list advanced-table-container",
    childView: ClassificationView,
    childViewContainer: 'tbody.classification-list',

    defaultSortBy: ['name'],

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;