/**
 * @file search.js
 * @brief Helper to make easier the creation of select2 component with a search by cursor.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-10-25
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let search = function(parent, url, filtersCallback, options) {
    options || (options = {});

    options.minimumInputLength || (options.minimumInputLength = 3);
    options.more || (options.more = 30);
    options.placeholder || (options.placeholder = _t("3 characters at least for auto-completion"));

    return {
        dropdownParent: parent,
        ajax: {
            url: url,
            dataType: 'json',
            delay: 250,
            data: function (params) {
                params.term || (params.term = '');

                let filters = filtersCallback(params);

                return {
                    more: options.more,
                    cursor: JSON.stringify(params.next),
                    filters: JSON.stringify(filters),
                };
            },
            processResults: function (data, params) {
                // no pagination
                params.page = params.page || 1;
                params.next = data.next;

                let results = [];

                for (let i = 0; i < data.items.length; ++i) {
                    results.push({
                        id: data.items[i].id,
                        text: data.items[i].label
                    });
                }

                return {
                    results: results,
                    pagination: {
                        more: params.next !== null && data.items.length >= options.more
                    }
                };
            },
            cache: true
        },
        minimumInputLength: options.minimumInputLength,
        placeholder: options.placeholder
    };
};

module.exports = search;
