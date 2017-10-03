/**
 * @file languagelist.js
 * @brief Data language list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-06-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var LanguageView = require('../views/language');
var AdvancedTable = require('./advancedtable');

var View = AdvancedTable.extend({
    template: require("../templates/languagelist.html"),
    className: "language-list advanced-table-container",
    childView: LanguageView,
    childViewContainer: 'tbody.language-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
