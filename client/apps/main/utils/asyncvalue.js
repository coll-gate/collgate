/**
 * @file asyncvalue.js
 * @brief Initiate a html content into an element asynchronously using cache mechanism et dynamic data access.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

(function($) {
    // @todo for now once async initialisation, manual update, could be more synced to cache invalidation
    $.fn.asyncvalue = function (method, options) {
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
                        span.data('data-format', options.format);
                    });

                    application.main.cache.lookup({
                        type: options.type,
                        format: options.format
                    }, values).done(function (data) {
                        // init each popover span
                        spans.each(function(i, element) {
                            let span = $(this);
                            let value = parseInt(span.attr('value'));

                            span.html(data[value].value.label);
                        });
                    });
                } else {
                    let span = el.children('span.' + options.className);
                    let created = false;

                    if (!span.length) {
                        span = $('<span class="async-value" value="" data-async-value="managed">' + (options.label || "") + '</span>');
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

                    let value = parseInt(span.attr('value'));

                    if (Number.isInteger(value)) {
                        application.main.cache.lookup({
                            type: span.attr('data-type'),
                            format: span.data('data-format')
                        }, [value]).done(function (data) {
                            // init element content
                            span.html(data[value].value.label);
                        });
                    }
                }
            } else if (method === 'update') {
                let value = parseInt(el.attr('value'));

                if (Number.isInteger(value)) {
                    application.main.cache.lookup({
                        type: el.attr('data-type'),
                        format: el.data('data-format')
                    }, [value]).done(function (data) {
                        // update element content
                        el.html(data[value].value.label);
                    });
                }
            } else if (method === 'destroy') {
                // destroy only if managed
                if (el.attr('data-async-value') === 'managed') {
                    el.children('span').destroy();
                }
            }
        });

        return this;
    };
})(jQuery);
