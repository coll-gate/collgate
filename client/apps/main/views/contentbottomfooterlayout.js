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

var View = Marionette.View.extend({
    template: require("../templates/contentbottomfooterlayout.html"),

    attributes: {
        style: "height: 100%; display: flex; flex-direction: column;"
    },

    regions: {
        'content': "div.content",
        'bottom': "div.layout-bottom",
        'footer': "div.layout-footer"
    },

    childViewEvents: {
        'select:tab': function (region, child) {
            this.triggerMethod('select:tab', region, child);
        },
        'dom:refresh': function(child) {
            // call onShowTab when the view is inserted and directly visible
            if (child && child.onShowTab && this.$el.isInViewport() && child.$el.isInViewport()) {
                // child.onShowTab();

                // @todo fix the last Mn 3 issue, must be cleaned once fixed on next Mn version
                // only as possible (2 of 2) fixtures
                if (this._lastRegion && this._lastRegion.currentView) {
                    // child.onShowTab(this._lastRegion);
                    this._lastRegion = null;
                }
            }
        }
    },

    onShowTab: function(tabView) {
        this._lastRegion = tabView;

        var view = this.getChildView('content');
        if (view && view.onShowTab) {
            view.onShowTab(tabView);
        }

        view = this.getChildView('bottom');
        if (view && view.onShowTab) {
            view.onShowTab(tabView);
        }

        view = this.getChildView('footer');
        if (view && view.onShowTab) {
            view.onShowTab(tabView);
        }
    },

    onHideTab: function(tabView) {
        var view = this.getChildView('content');
        if (view && view.onHideTab) {
            view.onHideTab(tabView);
        }

        view = this.getChildView('bottom');
        if (view && view.onHideTab) {
            view.onHideTab(tabView);
        }

        view = this.getChildView('footer');
        if (view && view.onHideTab) {
            view.onHideTab(tabView);
        }
    },

    onResize: function() {
        var view = this.getChildView('content');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('bottom');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('footer');
        if (view && view.onResize) {
            view.onResize();
        }
    }
});

module.exports = View;
