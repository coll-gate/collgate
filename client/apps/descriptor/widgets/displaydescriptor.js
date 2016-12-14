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
    initAutocomplete: function(format, url, view, select, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (format.type.startsWith('enum_')) {
            if (format.list_type == "autocomplete") {
                var initials = [];

                var params = {
                    dropdownParent: $(view.el),
                    ajax: {
                        data: initials,
                        url: url + 'value/display/search/',
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
                    allowClear: true,
                    minimumInputLength: 3,
                    placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion"),
                };

                // autoselect the initial value
                if (definesValues) {
                    $.ajax({
                        type: "GET",
                        url: url + 'value/' + defaultValues[0] + '/display/',
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

    initEntitySelect: function(format, url, view, select, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (format.type === 'entity') {
            var initials = [];

            var params = {
                dropdownParent: $(view.el),
                ajax: {
                    data: initials,
                    url: url + 'search/',
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        params.term || (params.term = '');

                        return {
                            filters: JSON.stringify({
                                method: 'icontains',
                                fields: ['name'],
                                name: params.term
                            }),
                            cursor: params.next,
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
                allowClear: true,
                minimumInputLength: 3,
                placeholder: gt.gettext("Enter a value. 3 characters at least for auto-completion"),
            };

            // autoselect the initial value
            if (definesValues) {
                $.ajax({
                    type: "GET",
                    url: url + defaultValues[0] + '/',
                    dataType: 'json',
                }).done(function (data) {
                    initials.push({id: data.id, text: data.name});

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
    },

    initDropdown: function(format, url, view, select, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (format.type.startsWith('enum_')) {
            if (format.list_type == "dropdown") {
                // refresh values
                $.ajax({
                    url: url + 'value/display',
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

    initBoolean: function(format, view, select, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
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
                select.val(defaultValues[0]).trigger('change');
            }
        }
    },

    initOrdinal: function(format, view, select, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
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
                    select.val(defaultValues[0]).trigger('change');
                }
            }
        }
    },

    initDate: function(format, view, input, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        input.datetimepicker({
            locale: session.language,
            format: $.datepicker._defaults.dateFormat.toUpperCase(),
            showTodayButton: true,
            showClear: true,
            allowInputToggle: true
            //widgetParent: view.$el,
            //widgetPositioning: {
            //    vertical: 'auto',
            //    horizontal: 'auto'
            //}
        }).on('dp.show', function (e) {
            // fix position when parent has overflow-y defined
            // https://github.com/Eonasdan/bootstrap-datetimepicker/issues/790
            var datetimepicker = $('body').find('.bootstrap-datetimepicker-widget:last'),
                position = datetimepicker.offset(),
                parent = datetimepicker.parent(),
                parentPos = parent.offset(),
                width = datetimepicker.width(),
                parentWid = parent.width();

            // move datetimepicker to the exact same place it was but attached to body
            datetimepicker.appendTo('body');
            datetimepicker.css({
                position: 'absolute',
                top: position.top,
                bottom: 'auto',
                left: position.left,
                right: 'auto',
                'z-index': 10001
            });

            // if datetimepicker is wider than the thing it is attached to then move it so the centers line up
            if (parentPos.left + parentWid < position.left + width) {
                var newLeft = parentPos.left;
                newLeft += parentWid / 2;
                newLeft -= width / 2;
                datetimepicker.css({left: newLeft});
            }
        });

        if (definesValues) {
            var date = moment(defaultValues[0])
            $("#simple_value").val(date.format($.datepicker._defaults.dateFormat.toUpperCase()));
        }
    },

    initTime: function(format, view, input, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        input.datetimepicker({
            locale: session.language,
            format: 'HH:mm:ss',  // 24h
            showTodayButton: true,
            showClear: true,
            allowInputToggle: true
        }).on('dp.show', function (e) {
            // fix position when parent has overflow-y defined
            var datetimepicker = $('body').find('.bootstrap-datetimepicker-widget:last'),
                position = datetimepicker.offset(),
                parent = datetimepicker.parent(),
                parentPos = parent.offset(),
                width = datetimepicker.width(),
                parentWid = parent.width();

            // move datetimepicker to the exact same place it was but attached to body
            datetimepicker.appendTo('body');
            datetimepicker.css({
                position: 'absolute',
                top: position.top,
                bottom: 'auto',
                left: position.left,
                right: 'auto',
                'z-index': 10001
            });

            // if datetimepicker is wider than the thing it is attached to then move it so the centers line up
            if (parentPos.left + parentWid < position.left + width) {
                var newLeft = parentPos.left;
                newLeft += parentWid / 2;
                newLeft -= width / 2;
                datetimepicker.css({left: newLeft});
            }
        });

        if (definesValues) {
            // HH:mm:ss
            $("#simple_value").val(defaultValues[0]);
        }
    },

    initDateTime: function(format, view, input, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        input.datetimepicker({
            locale: session.language,
            format: $.datepicker._defaults.dateFormat.toUpperCase() + ' HH:mm:ss',  // 24h
            showTodayButton: true,
            showClear: true,
            allowInputToggle: true
        }).on('dp.show', function (e) {
            // fix position when parent has overflow-y defined
            var datetimepicker = $('body').find('.bootstrap-datetimepicker-widget:last'),
                position = datetimepicker.offset(),
                parent = datetimepicker.parent(),
                parentPos = parent.offset(),
                width = datetimepicker.width(),
                parentWid = parent.width();

            // move datetimepicker to the exact same place it was but attached to body
            datetimepicker.appendTo('body');
            datetimepicker.css({
                position: 'absolute',
                top: position.top,
                bottom: 'auto',
                left: position.left,
                right: 'auto',
                'z-index': 10001
            });

            // if datetimepicker is wider than the thing it is attached to then move it so the centers line up
            if (parentPos.left + parentWid < position.left + width) {
                var newLeft = parentPos.left;
                newLeft += parentWid / 2;
                newLeft -= width / 2;
                datetimepicker.css({left: newLeft});
            }
        });

        if (definesValues) {
            var date = moment(defaultValues[0])
            $("#simple_value").val(date.format($.datepicker._defaults.dateFormat.toUpperCase() + ' HH:mm:ss'));
        }
    },

    initGpsCoordinate: function(format, view, input, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        // @todo
    },

    initNumeric: function (format, view, input, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        if (format.type === "numeric") {
            $(input).numeric({
                allowPlus           : false,
                allowMinus          : true,
                allowThouSep        : false,
                allowDecSep         : true,
                allowLeadingSpaces  : false,
                maxDigits           : NaN,
                maxDecimalPlaces    : format.precision,
                maxPreDecimalPlaces : NaN,
                max                 : NaN,
                min                 : NaN
            });
        } else if (format.type === "numeric_range") {
            // @todo .toFixed(....) for read value ?
            $(input).numeric({
                allowPlus           : false,
                allowMinus          : format.range[0] < 0 ? true : false,
                allowThouSep        : false,
                allowDecSep         : true,
                allowLeadingSpaces  : false,
                maxDigits           : NaN,
                maxDecimalPlaces    : format.precision,
                maxPreDecimalPlaces : NaN,
                max                 : format.range[1],
                min                 : format.range[0]
            });
        } else if (format.type === "ordinal") {
            $(input).numeric({
                allowPlus           : false,
                allowMinus          : format.range[0] < 0 ? true : false,
                allowThouSep        : false,
                allowDecSep         : false,
                allowLeadingSpaces  : false,
                maxDigits           : NaN,
                maxDecimalPlaces    : NaN,
                maxPreDecimalPlaces : NaN,
                max                 : format.range[1],
                min                 : format.range[0]
            });
        }

        if (definesValues) {
            input.val(defaultValues[0]);
        }
    },

    validationHelper: function(input, type, comment) {
        var el = input.parent().parent();

        if (!el.hasClass('has-feedback')) {
            el.addClass('has-feedback');
        }

        var help = input.parent().siblings('span.help-block');
        if (help.length == 0) {
            help = $('<span class="help-block"></span>');
            el.append(help);
        }

        if (type == -1) {
            el.addClass('has-error');
            input.addClass('invalid');

            help.show(false);
            help.text(comment);
        } else {
            el.removeClass('has-error');
            input.removeClass('invalid');

            help.hide(false);
            help.text("");
        }
    },

    initText: function (format, view, input, definesValues, defaultValues) {
        if (typeof definesValues === "undefined") {
            definesValues = false;
        }

        // hard limit to 1024 characters
        input.attr('maxlength', 1024);

        if (format.type === "string") {
            if (typeof format.regexp !== "undefined") {
                input.on("input", function(e) {
                    // check regexp and max length of 1024
                    var val = $(e.target).val();
                    var re = new RegExp(format.regexp);
                    var el = $(e.target);

                    if (val.length > 1024) {
                        DisplayDescriptor.validationHelper(el, -1, gt.gettext("1024 characters max"));
                    } else if (!re.test(val)) {
                        DisplayDescriptor.validationHelper(el, -1, gt.gettext("Invalid format"));
                    } else {
                        DisplayDescriptor.validationHelper(el, 0, null);
                    }

                    return true;
                });
            } else {
                input.on("input", function(e) {
                    var val = $(e.target).val();
                    var el = $(e.target);

                    // hard limit to 1024 characters
                    if (val.length > 1024) {
                        DisplayDescriptor.validationHelper(el, -1, gt.gettext("1024 characters max"));
                    } else {
                        DisplayDescriptor.validationHelper(el, 0, null);
                    }

                    return true;
                });
            }
        }

        if (definesValues) {
            input.val(defaultValues[0]);
        }
    },
};

module.exports = DisplayDescriptor;
