/**
 * @file contentbottomlayout.js
 * @brief Two rows content+bottom layout
 * @author Frederic SCHERMA
 * @date 2017-02-01
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    template: require("../templates/contentbottomlayout.html"),

    attributes: {
        style: "height: 100%; display: flex; flex-direction: column;"
    },

    regions: {
        'content': "div.content",
        'bottom': "div.layout-bottom"
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
    }
});

module.exports = View;
