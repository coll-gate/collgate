/**
 * @file fixtures.js
 * @brief Some workarounds.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-06-29
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details https://github.com/select2/select2/issues/4614
 */

(function($) {
    $.fn.fixSelect2Position = function (el) {
        $(this).data('select2').on('results:message', function (params) {
            this.dropdown._resizeDropdown();
            this.dropdown._positionDropdown();
        });
    };
    /*$.fn.fixSelect2Position = function (el) {
        $(this).on('select2:open', function (e) {
            let sel = $(this).parent().find('.select2-container');
            let el = $(sel.get(0));
            let dropdown = $(sel.get(1));

            if ($(sel.get(0)).css('position') === 'absolute') {
                el = $(sel.get(1));
                dropdown = $(sel.get(0));
            }

            let top = el.position().top;
            if (el.hasClass('select2-container--above')) {
                dropdown.css('top', (top - 2 * (el.height() - dropdown.height())) + 'px');
            } else {
                dropdown.css('top', (top + el.height()) + 'px');
            }
        });
    };*/
})(jQuery);
