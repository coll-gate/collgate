/**
 * @file contentbottomfooterlayout.js
 * @brief Two rows content+bottom+footer layout
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-31
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    template: require("../templates/contentbottomfooterlayout.html"),

    attributes: {
        style: "height: 100%; display: flex; flex-direction: column;"
    },

    regions: {
        'content': "div.content",
        'bottom': "div.layout-bottom",
        'footer': "div.layout-footer"
    },

    childEvents: {
        'select:tab': function (child) {
            this.triggerMethod('select:tab', child);
        },
    },

    onShowTab: function(tabView) {
        var region = this.getRegion('content');
        if (region && region.currentView && region.currentView.onShowTab) {
            region.currentView.onShowTab(tabView);
        }

        region = this.getRegion('bottom');
        if (region && region.currentView && region.currentView.onShowTab) {
            region.currentView.onShowTab(tabView);
        }

        region = this.getRegion('footer');
        if (region && region.currentView && region.currentView.onShowTab) {
            region.currentView.onShowTab(tabView);
        }
    },

    onHideTab: function(tabView) {
        var region = this.getRegion('content');
        if (region && region.currentView && region.currentView.onHideTab) {
            region.currentView.onHideTab(tabView);
        }

        region = this.getRegion('bottom');
        if (region && region.currentView && region.currentView.onHideTab) {
            region.currentView.onHideTab(tabView);
        }

        region = this.getRegion('footer');
        if (region && region.currentView && region.currentView.onHideTab) {
            region.currentView.onHideTab(tabView);
        }
    },

    onResize: function() {
        var view = this.getRegion('content');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        view = this.getRegion('bottom');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        view = this.getRegion('footer');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }
    }
});

module.exports = View;
