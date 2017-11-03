/**
 * @file defaultlayout.js
 * @brief Default layout with one Bootstrap panel
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let DefaultLayout = Marionette.View.extend({
    template: require("../templates/defaultlayout.html"),
    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'title': ".panel-title",
        'content': ".panel-body",
        'content-bottom': ".panel-body-bottom",
        'bottom': ".panel-bottom"
    },

    childViewEvents: {
        'select:tab': function (region, child) {
            this.triggerMethod('select:tab', region, child);
        }
    },

    onBeforeDestroy: function () {
        // destroy any body popovers (could be done at another level of layout, or using a child event)
        $('body div.popover').remove();
    },

    onResize: function() {
        let view = this.getChildView('title');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('content');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('content-bottom');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('bottom');
        if (view && view.onResize) {
            view.onResize();
        }
    }
});

module.exports = DefaultLayout;
