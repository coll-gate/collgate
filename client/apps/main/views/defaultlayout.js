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

var DefaultLayout = Marionette.LayoutView.extend({
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

    onBeforeDestroy: function () {
    },

    onResize: function() {
        var view = this.getRegion('title');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        view = this.getRegion('content');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        view = this.getRegion('content-bottom');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        view = this.getRegion('bottom');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }
    }
});

module.exports = DefaultLayout;
