/**
 * @file contentbottomfooterlayout.js
 * @brief Two rows content+bottom+footer layout
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-31
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
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
                if (this._lastRegion && this._lastRegion.currentView === this) {
                    child.onShowTab(this._lastRegion);
                }
            }
        }
    },

    onShowTab: function(tabView) {
        this._lastRegion = tabView;

        let view = this.getChildView('content');
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
        this._lastRegion = null;

        let view = this.getChildView('content');
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
        let view = this.getChildView('content');
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
