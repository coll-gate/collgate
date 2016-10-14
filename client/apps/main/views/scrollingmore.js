/**
 * @file scrollingmoreview.js
 * @brief Simple view that add a more button.
 * @author Frederic SCHERMA
 * @date 2016-09-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    template: _.template('<span class="unselectable scroll-more action label label-default"><span class="glyphicon glyphicon-option-horizontal"></span>'),
    tagName: 'div',
    className: 'scrolling-more',
    attributes: {
        style: "margin: 5px; margin-left: 48%; margin-right: 52%;"
    },

    ui: {
        'scroll-more': 'span.scroll-more'
    },

    events: {
        'click @ui.scroll-more': 'onScroll'
    },

    initialize: function(options) {
        options || (options = {});

        if (options.targetView) {
            this.targetView = options.targetView;
        }

        if (options.more) {
            this.more = options.more;
        } else {
            this.more = -1;
        }
    },

    onRender: function() {
    },

    onScroll: function() {
        if (this.targetView && this.targetView.moreResults) {
            this.targetView.moreResults(this.more, true);
        }
    }
});

module.exports = View;
