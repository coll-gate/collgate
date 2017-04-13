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
    className: "batch-list advanced-table-container",
    childView: BatchView,
    childViewContainer: 'tbody.batch-list',

    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.getOption('columns')
        }
    },

    childViewOptions: function () {
        return {
            columns: this.getOption('columns')
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        options || (options = {});
        options.columns = [
        ];

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
