/**
 * @file cultivarlist.js
 * @brief Cultivar list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-05-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var CultivarView = require('../views/cultivar');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/cultivarlist.html"),
    className: "cultivar-list advanced-table-container",
    childView: CultivarView,
    childViewContainer: 'tbody.cultivar-list',
    userSettingName: '_cultivar_list_columns',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
