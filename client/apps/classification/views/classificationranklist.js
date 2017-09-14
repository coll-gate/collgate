/**
 * @file classificationranklist.js
 * @brief List of rank of classification view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var ClassificationRankView = require('../views/classificationrank');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/classificationranklist.html"),
    className: "object classification-rank-list advanced-table-container",
    childView: ClassificationRankView,
    childViewContainer: 'tbody.classification-rank-list',

    defaultSortBy: ['name'],

    childViewOptions: function () {
        return {
            classification: this.getOption('classification')
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
