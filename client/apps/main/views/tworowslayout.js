/**
 * @file tworowslayout.js
 * @brief Two rows layout
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-10
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let TwoRowsLayout = Marionette.View.extend({
    template: require("../templates/tworowslayout.html"),
    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'up': "div.row-up",
        'down': "div.row-down"
    },

    childViewEvents: {
        'select:tab': function (region, child) {
            this.triggerMethod('select:tab', region, child);
        },
    },

    onResize: function() {
        let view = this.getChildView('up');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('down');
        if (view && view.onResize) {
            view.onResize();
        }
    }
});

module.exports = TwoRowsLayout;
