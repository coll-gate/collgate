/**
 * @file twocolumnslayout.js
 * @brief Two columns layout
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var TwoColumnsLayout = Marionette.LayoutView.extend({
    template: require("../templates/twocolumnslayout.html"),
    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'left-content': ".left-content",
        'left-bottom': ".left-bottom",
        'right-content': ".right-content",
        'right-bottom': ".right-bottom",
    }
});

module.exports = TwoColumnsLayout;

