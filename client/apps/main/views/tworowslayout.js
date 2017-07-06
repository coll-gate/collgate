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

var TwoRowsLayout = Marionette.View.extend({
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
        var view = this.getRegion('up');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        view = this.getRegion('down');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }
    }
});

module.exports = TwoRowsLayout;
