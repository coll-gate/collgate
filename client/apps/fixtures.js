/**
 * @file fixtures.js
 * @brief Some workarounds.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-06-29
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

(function($) {
    $.fn.fixSelect2Position = function (el) {
        $(this).on('select2:open', function (e) {
            var sel = $(this).parent().find('.select2-container');
            var el = $(sel.get(0));
            var dropdown = $(sel.get(1));

            if ($(sel.get(0)).css('position') === 'absolute') {
                el = $(sel.get(1));
                dropdown = $(sel.get(0));
            }

            var top = el.position().top;
            if (el.hasClass('select2-container--above')) {
                dropdown.css('top', (top - 2 * (el.height() - dropdown.height())) + 'px');
            } else {
                dropdown.css('top', (top + el.height()) + 'px');
            }
        });
    };
})(jQuery);
