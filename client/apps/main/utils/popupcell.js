/**
 * @file popover.js
 * @brief Initiate a bootstrap popover into a parent element.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

(function($) {
    // @todo for now once async initialisation, manual update, could be more synced to cache invalidation
    // @todo could be merger into asyncvalue with a popover option (style)
    $.fn.popupcell = function (method, options) {
        options || (options = {});

        this.each(function() {
            let el = $(this);

            if (method === 'init') {
                // batch over children having span.className
                if (options.children) {
                    let spans = el.find('span.' + options.className);
                    let values = [];

                    spans.each(function(i, element) {
                        let span = $(this);

                        values.push(span.attr('value'));

                        span.attr('data-type', options.type);
                        span.attr('data-placement', 'bottom');
                        span.data('data-format', options.format);
                    });

                    // process mouseover on the container to avoid multiple initializations
                    el.one('mouseover', function (e) {
                        application.main.cache.lookup({
                            type: options.type,
                            format: options.format
                        }, values).done(function (data) {
                            // init each popover span
                            spans.each(function(i, element) {
                                let span = $(this);
                                let value = parseInt(span.attr('value'));

                                span.attr('data-content', data[value].value.label);
                                span.popover({'trigger': 'hover'});

                                // manually show it if still hover once data is synced
                                if (span.is(':hover')) {
                                    span.popover('show');
                                }
                            });
                        });
                    });
                } else {
                    let span = el.children('span.' + options.className);
                    let created = false;

                    if (!span.length) {
                        span = $('<span class="popover-dismiss" data-toggle="popover" data-popupcell="managed" data-placement="bottom" data-container="body" data-content="" value="">' + (options.label || "") + '</span>');
                        created = true;

                        if (options.className) {
                            span.addClass(options.className);
                        }
                    }

                    if ("value" in options) {
                        span.attr('value', options.value);
                    }

                    span.attr('data-type', options.type);
                    span.data('data-format', options.format);

                    if (created) {
                        el.html(span);
                    }

                    span.one('mouseover', function (e) {
                        let el = $(this);
                        let value = parseInt(el.attr('value'));

                        if (Number.isInteger(value)) {
                            application.main.cache.lookup({
                                type: el.attr('data-type'),
                                format: el.data('data-format')
                            }, [value]).done(function (data) {
                                el.attr('data-content', data[value].value.label);
                                el.popover({'trigger': 'hover'});

                                // manually show it if still hover once data is synced
                                if (el.is(':hover')) {
                                    el.popover('show');
                                }
                            });
                        }
                    });
                }
            } else if (method === 'update') {
                let value = parseInt(el.attr('value'));

                if (Number.isInteger(value)) {
                    application.main.cache.lookup({
                        type: el.attr('data-type'),
                        format: el.data('data-format')
                    }, [value]).done(function (data) {
                        el.attr('data-content', data[value].value.label);
                    });
                }
            } else if (method === 'destroy') {
                if (el.attr('data-popupcell') === 'managed') {
                    el.children('span').popover('destroy').destroy();
                }
            }
        });

        return this;
    };
})(jQuery);
