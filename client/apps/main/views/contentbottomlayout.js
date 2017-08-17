/**
 * @file contentbottomlayout.js
 * @brief Two rows content+bottom layout
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    template: require("../templates/contentbottomlayout.html"),

    attributes: {
        style: "height: 100%; display: flex; flex-direction: column;"
    },

    regions: {
        'content': "div.content",
        'bottom': "div.layout-bottom"
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

        var view = this.getChildView('content');
        if (view && view.onShowTab) {
            view.onShowTab(tabView);
        }

        view = this.getChildView('bottom');
        if (view && view.onShowTab) {
            view.onShowTab(tabView);
        }
    },

    onHideTab: function(tabView) {
        this._lastRegion = null;

        var view = this.getChildView('content');
        if (view && view.onHideTab) {
            view.onHideTab(tabView);
        }

        view = this.getChildView('bottom');
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
    }
});

module.exports = View;
