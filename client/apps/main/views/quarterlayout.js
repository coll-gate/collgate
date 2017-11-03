/**
 * @file quarterlayout.js
 * @brief Two columns of two rows layout
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-03
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    template: require("../templates/quarterlayout.html"),
    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'top-left': "div.row-up div.left",
        'bottom-left': "div.row-down div.left",
        'top-right': "div.row-up div.right",
        'bottom-right': "div.row-down div.right"
    },

    childViewEvents: {
        'select:tab': function (region, child) {
            this.triggerMethod('select:tab', region, child);
        },
    },

    onResize: function() {
        let view = this.getChildView('top-left');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('bottom-left');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('top-right');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('bottom-right');
        if (view && view.onResize) {
            view.onResize();
        }
    }
});

module.exports = View;
