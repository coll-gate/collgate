/**
 * @file displayreaddescriptor.js
 * @brief Display the correct widget for a type of descriptor and its values with a default for reading only.
 * @author Frederic SCHERMA
 * @date 2016-12-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DisplayReadDescriptor = {
    isValueDefined: function (definesValues, defaultValues) {
        return !!definesValues && !!defaultValues && defaultValues[0] != null;
    },

    initAutocomplete: function(format, url, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (format.type.startsWith('enum_')) {
            if (format.list_type == "autocomplete") {
                if (definesValues) {
                    $.ajax({
                        type: "GET",
                        url: url + 'value/' + defaultValues[0] + '/display/',
                        dataType: 'json'
                    }).done(function (data) {
                        var linput = input.is('input') ? input : input.children('input');
                        linput.val(data.label);
                    });
                }
            }
        }
    },

    initEntitySelect: function(format, url, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (format.type === 'entity') {
            if (definesValues) {
                $.ajax({
                    type: "GET",
                    url: url + defaultValues[0] + '/',
                    dataType: 'json'
                }).done(function (data) {
                    var linput = input.is('input') ? input : input.children('input');
                    linput.val(data.name);
                });
            }
        }
    },

    initDropdown: function(format, url, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (format.type.startsWith('enum_')) {
            if (format.list_type == "dropdown") {
                if (definesValues) {
                    $.ajax({
                        type: "GET",
                        url: url + 'value/' + defaultValues[0] + '/display/',
                        dataType: 'json'
                    }).done(function (data) {
                        var linput = input.is('input') ? input : input.children('input');
                        linput.val(data.label);
                    });
                }
            }
        }
    },

    initBoolean: function(format, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (format.type === 'boolean') {
            if (definesValues) {
                var linput = input.is('input') ? input : input.children('input');
                linput.val(defaultValues[0] ? gt.gettext('Yes') : gt.gettext('No'));
            }
        }
    },

    initOrdinal: function(format, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (format.type === 'ordinal') {
            if (definesValues) {
                var linput = input.is('input') ? input : input.children('input');
                linput.val(defaultValues[0]);
            }
        }
    },

    initDate: function(format, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (definesValues) {
            var date = moment(defaultValues[0]);
            var linput = input.is('input') ? input : input.children('input');
            linput.val(date.format($.datepicker._defaults.dateFormat.toUpperCase()));
        }
    },

    initTime: function(format, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (definesValues) {
            // HH:mm:ss
            var linput = input.is('input') ? input : input.children('input');
            linput.val(defaultValues[0]);
        }
    },

    initDateTime: function(format, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (definesValues) {
            var date = moment(defaultValues[0]);
            var linput = input.is('input') ? input : input.children('input');
            linput.val(date.format($.datepicker._defaults.dateFormat.toUpperCase() + ' HH:mm:ss'));
        }
    },

    initGpsCoordinate: function(format, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (definesValues) {
            var linput = input.is('input') ? input : input.children('input');
            // @todo
        }
    },

    initNumeric: function (format, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (definesValues) {
            var linput = input.is('input') ? input : input.children('input');
            linput.val(defaultValues[0]);
        }
    },

    initText: function (format, view, input, definesValues, defaultValues) {
        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (definesValues) {
            var linput = input.is('input') ? input : input.children('input');
            linput.val(defaultValues[0]);
        }
    }
};

module.exports = DisplayReadDescriptor;
