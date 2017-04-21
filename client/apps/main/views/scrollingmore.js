/**
 * @file scrollingmore.js
 * @brief Simple view that add a more button.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    template: require('../templates/scrollingmore.html'),
    tagName: 'div',
    className: 'scrolling-more',
    attributes: {
        style: "margin: 5px; margin-left: 48%; margin-right: 52%;"
    },

    ui: {
        'scroll-less': 'span.scroll-less',
        'scroll-more': 'span.scroll-more'
    },

    events: {
        'click @ui.scroll-less': 'onScrollLess',
        'click @ui.scroll-more': 'onScrollMore'
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

    onScrollLess: function() {
        if (this.targetView && this.targetView.scrollOnePage) {
            this.targetView.scrollOnePage(-1);
        } else if (this.targetView) {
            var scrollElement = this.targetView.$el.parent();
            var clientHeight = scrollElement.prop('clientHeight');

            // view page scrolling
            scrollElement.scrollTop(scrollElement.scrollTop() - clientHeight);
        }
    },

    onScrollMore: function() {
        if (this.targetView && this.targetView.moreResults) {
            var moreResults = true;

            if (this.targetView.isNeedMoreResults) {
                moreResults = this.targetView.isNeedMoreResults();
            }

            if (moreResults) {
                this.targetView.moreResults(this.more, true);
            } else {
                this.targetView.scrollOnePage(1);
            }
        } else if (this.targetView) {
            var scrollElement = this.targetView.$el.parent();
            var clientHeight = scrollElement.prop('clientHeight');

            // view page scrolling
            scrollElement.scrollTop(scrollElement.scrollTop() + clientHeight);
        }
    }
});

module.exports = View;

