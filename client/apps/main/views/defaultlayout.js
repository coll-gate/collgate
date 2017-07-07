/**
 * @file defaultlayout.js
 * @brief Default layout with one Bootstrap panel
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var DefaultLayout = Marionette.View.extend({
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
    },

    onResize: function() {
        var view = this.getChildView('title');
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
