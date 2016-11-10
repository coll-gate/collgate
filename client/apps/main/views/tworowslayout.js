/**
 * @file tworowslayout.js
 * @brief Two rows layout
 * @author Frederic SCHERMA
 * @date 2016-12-10
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TwoRowsLayout = Marionette.LayoutView.extend({
    template: "#two_rows_layout_view",
    attributes: {
        // style: "height: 95%;"
    },

    regions: {
        'top-content': ".top-content",
        'top-bottom': ".top-bottom",
        'bottom-content': ".bottom-content",
        'bottom-bottom': ".bottom-bottom",
    },

    onBeforeShow: function() {
    },

    onBeforeDestroy: function () {
    },
});

module.exports = TwoRowsLayout;
