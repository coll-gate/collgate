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
    // attributes: {
    //     style: "margin: 5px; margin-left: 48%; margin-right: 52%;"
    // },

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

        if (this.getOption('collection')) {
            this.getOption('collection').count();

            this.listenTo(this.getOption('collection'), 'count', this.onUpdateCount, this);
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

    onUpdateCount: function(count) {
        this.ui.collection_position.html(1);
        this.ui.collection_count.html(count);
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
                var top = view.targetView.ui.tbody.parent().parent().offset().top;

                if (view.previousTopElement) {
                    if (view.previousTopElement.offset().top <= top) {
                        var element = view.previousTopElement;
                        var i = view.previousTopElementIndex;

                        view.previousTopElement = null;

                        while (element.length) {
                            if (element.offset().top + element.height() >= top) {
                                view.ui.collection_position.html(i + 1);
                                view.previousTopElement = element;
                                view.previousTopElementIndex = i;

                                return;
                            }

                            element = element.next();
                            ++i;
                        }
                    } else if (view.previousTopElement.offset().top > top) {
                        var element = view.previousTopElement;
                        var i = view.previousTopElementIndex;

                        this.previousTopElement = null;

                        while (element.length) {
                            if (element.offset().top + element.height() < top) {
                                view.ui.collection_position.html(i + 1);
                                view.previousTopElement = element;
                                view.previousTopElementIndex = i;

                                return;
                            }

                            element = element.prev();
                            --i;
                        }
                    }
                }

                var rows = view.targetView.ui.tbody.children('tr');

                view.previousTopElement = null;
                view.previousTopElementIndex = 0;

                $.each(rows, function (i, el) {
                    var element = $(el);

                    if (element.offset().top + element.height() >= top) {
                        view.ui.collection_position.html(i + 1);
                        view.previousTopElement = element;
                        view.previousTopElementIndex = i;

                        return false;
                    }
                });
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
