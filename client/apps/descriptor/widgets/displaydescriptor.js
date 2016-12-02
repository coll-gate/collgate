/**
 * @file displaydescriptor.js
 * @brief Display the correct widget for a type of descriptor and its values with a default.
 * @author Frederic SCHERMA
 * @date 2016-12-02
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var DisplayDescriptor = {
    initAutocomplete: function(descriptorType, view, select, definesValues, defaultValues) {
        var format = descriptorType.get('format');

        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (typeof definesValues === "undefined") {
            definesValues = null;
        }

        if (format.type.startsWith('enum_')) {
            if (format.list_type == "autocomplete") {
                var initials = [];

                var params = {
                    dropdownParent: $(view.el),
                    ajax: {
                        data: initials,
                        url: descriptorType.url() + 'value/display/search/',
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            return {
                                cursor: params.next,
                                value: params.term,
                            };
                        },
                        processResults: function (data, params) {
                            params.next = null;

                            if (data.items.length >= 30) {
                                params.next = data.next || null;
                            }

                            var results = [];

                            for (var i = 0; i < data.items.length; ++i) {
                                results.push({
                                    id: data.items[i].id,
                                    text: data.items[i].label
                                });
                            }

                            return {
                                results: results,
                                pagination: {
                                    more: params.next != null
                                }
                            };
                        },
                        cache: true
                    },
                    minimumInputLength: 3,
                    placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion"),
                };

                // autoselect the initial value
                if (definesValues) {
                    $.ajax({
                        type: "GET",
                        url: descriptorType.url() + 'value/' + defaultValues[0] + '/display/',
                        dataType: 'json',
                    }).done(function (data) {
                        initials.push({id: data.id, text: data.label});

                        params.data = initials;

                        select.select2(params);

                        if (definesValues) {
                            select.val(defaultValues).trigger('change');
                        }
                    });
                } else {
                    // make an autocomplete widget on simple_value
                    select.select2(params);
                }
            }
        }
    },

    initEntityAutoselect: function(descriptorType, view, select, definesValues, defaultValues) {
        var format = descriptorType.get('format');

        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (typeof definesValues === "undefined") {
            definesValues = null;
        }

        if (format.type === 'boolean') {
            // @todo
        }
    },

    initDropdown: function(descriptorType, view, select, definesValues, defaultValues) {
        var format = descriptorType.get('format');

        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (typeof definesValues === "undefined") {
            definesValues = null;
        }

        if (format.type.startsWith('enum_')) {
            if (format.list_type == "dropdown") {
                // refresh values
                $.ajax({
                    url: descriptorType.url() + 'value/display',
                    dataType: 'json',
                }).done(function (data) {
                    for (var i = 0; i < data.length; ++i) {
                        var option = $("<option></option>");

                        option.attr("value", data[i].value);
                        option.attr("title", data[i].label);

                        // for LTR languages add prefix
                        if (data[i].offset) {
                            var offset = "";
                            for (var j = 0; j < data[i].offset; ++j) {
                                offset += "&#160;&#160;&#160;&#160;";
                            }

                            if (session.languageDirection == "ltr") {
                                option.html(offset + data[i].label);
                            } else {
                                option.html(data[i].label + offset);
                            }
                        } else {
                            option.html(data[i].label);
                        }

                        select.append(option);
                    }

                    select.selectpicker('refresh');

                    if (definesValues) {
                        select.val(defaultValues).trigger('change');
                    }
                });
            }
        }
    },

    initBoolean: function(descriptorType, view, select, definesValues, defaultValues) {
        var format = descriptorType.get('format');

        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (typeof definesValues === "undefined") {
            definesValues = null;
        }

        if (format.type === 'boolean') {
            // true
            var option = $("<option></option>");

            option.attr("value", true);
            option.html(gt.gettext('Yes'));

            select.append(option);

            // false
            option = $("<option></option>");

            option.attr("value", false);
            option.html(gt.gettext('No'));

            select.append(option);

            select.selectpicker('refresh');

            if (definesValues) {
                select.val(defaultValues).trigger('change');
            }
        }
    },

    initOrdinal: function(descriptorType, view, select, definesValues, defaultValues) {
        var format = descriptorType.get('format');

        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (typeof definesValues === "undefined") {
            definesValues = null;
        }

        if (format.type === 'ordinal') {
            var len = format.range[1] - format.range[0] + 1;

            if (len <= 256) {
                for (var i = format.range[0]; i <= format.range[1]; ++i) {
                    var option = $("<option></option>");

                    option.attr("value", i);
                    option.html(i);

                    select.append(option);
                }

                select.selectpicker('refresh');

                if (definesValues) {
                    select.val(defaultValues).trigger('change');
                }
            }
        }
    },

    initDate: function(descriptorType, view, input, definesValues, defaultValues) {
        // @todo
    },

    initTime: function(descriptorType, view, input, definesValues, defaultValues) {
        // @todo
    },

    initDateTime: function(descriptorType, view, input, definesValues, defaultValues) {
        // @todo
    },

    initGpsCoordinate: function(descriptorType, view, input, definesValues, defaultValues) {
        // @todo
    },

    initNumeric: function (descriptorType, view, input, definesValues, defaultValues) {
        // @todo validator (min, max, decimal, precision) on input
    },

    initText: function (descriptorType, view, input, definesValues, defaultValues) {
        // @todo validator (regexp, length...) on input
    },
};

module.exports = DisplayDescriptor;
