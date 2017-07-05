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

    ui: {
        scroll_less: 'span.scroll-less',
        scroll_more: 'span.scroll-more',
        collection_count_group: 'div.collection-count-group',
        collection_position: 'span.collection-position',
        collection_count: 'span.collection-count'
    },

    events: {
        'click @ui.scroll_less': 'onScrollLess',
        'click @ui.scroll_more': 'onScrollMore'
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

        var collection = this.getOption('collection');
        if (collection && collection.count) {
            // update count and reset position on on count signal
            this.listenTo(collection, 'count', this.onUpdateCount, this);

            // update position on reset collection
            this.listenTo(collection, 'reset', this.onUpdatePosition, this);

            // initial count query
            collection.count();
        }
    },

    onRender: function() {
        if (!this.getOption('collection')) {
            this.ui.collection_count_group.hide();
        }

        if (this.targetView && this.targetView.getScrollElement) {
            this.targetView.getScrollElement().on('scroll', $.proxy(this.onScroll, this));
        }
    },

    onResize: function() {
       this.updatePosition();
    },

    updatePosition: function() {
        var top = this.targetView.ui.tbody.parent().parent().offset().top;
        var found = false;

        if (this.previousTopElement) {
            if (this.previousTopElement.offset().top <= top) {
                var element = this.previousTopElement;
                var i = this.previousTopElementIndex;

                this.previousTopElement = null;

                while (element && element.length) {
                    if (element.offset().top + element.height() >= top) {
                        this.previousTopElement = element;
                        this.previousTopElementIndex = i;

                        found = true;
                        break;
                    }

                    element = element.next();
                    ++i;
                }
            } else if (this.previousTopElement.offset().top > top) {
                var element = this.previousTopElement;
                var i = this.previousTopElementIndex;

                this.previousTopElement = null;

                while (element && element.length) {
                    if (element.offset().top <= top) {
                        this.previousTopElement = element;
                        this.previousTopElementIndex = i;

                        found = true;
                        break;
                    }

                    element = element.prev();
                    --i;
                }
            }
        }

        if (!found) {
            var rows = this.targetView.ui.tbody.children('tr');
            var view = this;

            this.previousTopElement = null;
            this.previousTopElementIndex = 0;

            $.each(rows, function (i, el) {
                var element = $(el);

                if (element.offset().top + element.height() >= top) {
                    view.previousTopElement = element;
                    view.previousTopElementIndex = i;

                    return false;
                }
            });
        }

        var bottom = top + this.targetView.ui.tbody.parent().parent().height();
        var element = this.previousTopElement;
        var i = this.previousTopElementIndex;

        while (element && element.length) {
            if (element.offset().top >= bottom) {
                break;
            }

            element = element.next();
            ++i;
        }

        var first = this.previousTopElement ? this.previousTopElementIndex + 1 : 0;
        var last = i;

        this.ui.collection_position.html(first + " - " + last);
    },

    onUpdateCount: function(count) {
        if (count === 0) {
            this.ui.collection_position.html(0 + " - " + 0);
            // this.updatePosition();
        } else {
            this.updatePosition();
        }
        this.ui.collection_count.html(count);
    },

    onUpdatePosition: function() {
        this.updatePosition();
    },

    onScroll: function(e) {
        if (this.targetView) {
            if (this.scrollEvent) {
                return;
            }

            this.scrollEvent = true;

            setTimeout(function(view) {
                // view destroyed before
                if (view.isDestroyed) {
                    return;
                }

                view.scrollEvent = false;
                view.updatePosition();
            }, 100, this);
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
