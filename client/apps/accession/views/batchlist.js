/**
 * @file batchlist.js
 * @brief Batch list view
 * @author Frederic SCHERMA
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var BatchView = require('../views/batch');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/batchlist.html"),
    childView: BatchView,
    childViewContainer: 'tbody.batch-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);

        View.__super__.initialize.apply(this);
    },
});

module.exports = View;
