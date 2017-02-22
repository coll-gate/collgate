/**
 * @file batchlist.js
 * @brief Batch list view
 * @author Frederic SCHERMA
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var BatchView = require('../views/batch');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/batchlist.html"),
    className: "batch-list",
    childView: BatchView,
    childViewContainer: 'tbody.batch-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
