/**
 * @file tworowslayout.js
 * @brief Two rows layout
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-10
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var TwoRowsLayout = Marionette.LayoutView.extend({
    template: require("../templates/tworowslayout.html"),
    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'up': "div.row-up",
        'down': "div.row-down"
    }
});

module.exports = TwoRowsLayout;

