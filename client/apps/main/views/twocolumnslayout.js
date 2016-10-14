/**
 * @file twocolumnlayout.js
 * @brief Two columns layout
 * @author Frederic SCHERMA
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TwoColumnsLayout = Marionette.LayoutView.extend({
    template: "#two_columns_layout_view",
    attributes: {
        style: "height: 95%;"
    },

    regions: {
        'left-content': ".left-content",
        'left-bottom': ".left-bottom",
        'right-content': ".right-content",
        'right-bottom': ".right-bottom",
    },

    onBeforeShow: function() {
    },

    onBeforeDestroy: function () {
    },
});

module.exports = TwoColumnsLayout;
