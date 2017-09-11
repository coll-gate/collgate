/**
 * @file popover.js
 * @brief Initiate a bootstrap popover into a div.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

(function($) {
    $.fn.popupcell = function (method, options) {
        options || (options = {});

        if (this.length) {
            console.log(this.length)
            this.each(function() {
                // @todo batch
            });
        }

        if (method === 'init') {
            var span = $('<span class="popover-dismiss" data-toggle="popover" data-placement="bottom" data-container="body" data-content="">' + options.label + '</span>');

            span.addClass(options.className);
            span.attr('value', options.value);
            span.attr('data-type', options.type);
            span.data('data-format', options.format);

            span.one('mouseover', function(e) {
                var el = $(this);
                var value = parseInt(el.attr('value'));

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

            return $(this).html(span);
        } else if (method === 'update') {
            var el = $(this);
            var value = parseInt(el.attr('value'));

            if (Number.isInteger(value)) {
                application.main.cache.lookup({
                    type: el.attr('data-type'),
                    format: el.data('data-format')
                }, [value]).done(function (data) {
                    el.attr('data-content', data[value].value.label);
                });
            }
        } else if (method === 'destroy') {
            $(this).children('span').popover('destroy').destroy();
        }
    };
})(jQuery);
