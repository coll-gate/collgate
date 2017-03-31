/**
 * @file leftonerighttwolayout.js
 * @brief Two columns, one row at left, two rows at right layout
 * @author Frederic SCHERMA
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TwoColumnsLayout = Marionette.LayoutView.extend({
    template: require("../templates/leftonerighttwolayout.html"),
    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'left-content': ".left-content",
        'left-bottom': ".left-bottom",
        'right-up-content': ".right-up-content",
        'right-up-bottom': ".right-up-bottom",
        'right-down-content': ".right-down-content",
        'right-down-bottom': ".right-down-bottom"
    }
});

module.exports = TwoColumnsLayout;
