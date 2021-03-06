/**
 * @file numericrange.js
 * @brief Display and manage a numeric range format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorFormatType = require('./descriptorformattype');

let NumericRange = function() {
    DescriptorFormatType.call(this);

    this.name = "numeric_range";
    this.group = "single";

    this.precision = 0;
};

_.extend(NumericRange.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, options) {
        options || (options = {
            readOnly: false,
            history: false
        });

        this.precision = format.precision;

        if (options.readOnly) {
            let input = this._createStdInput(parent, "fa-cog", options.history);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            let input = $('<input class="form-control" width="100%">');
            let clean = $('<span class="form-clean-btn action fa fa-eraser"></span>');
            this.groupEl = this._createInputGroup(parent, "fa-cog", input, options.history);

            clean.insertAfter(input);

            if (options.history) {
                // adjust position
                clean.css('right', '90px');
            }

            clean.on('click', function() {
               input.val("");
            });

            input.numeric({
                allowPlus           : false,
                allowMinus          : format.range[0] < 0,
                allowThouSep        : false,
                allowDecSep         : true,
                allowLeadingSpaces  : false,
                maxDigits           : NaN,
                maxDecimalPlaces    : format.precision,
                maxPreDecimalPlaces : NaN,
                max                 : format.range[1],
                min                 : format.range[0]
            });

            this.parent = parent;
            this.el = input;
        }
    },

    destroy: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                this.el.parent().remove();
            }
        }
    },

    enable: function() {
        if (this.el) {
            this.el.prop("disabled", false);
        }
    },

    disable: function() {
        if (this.el) {
            this.el.prop("disabled", true);
        }
    },

    set: function (format, definesValues, defaultValues) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.el.val(defaultValues);
            } else {
                this.el.val("");
            }
        } else {
            if (definesValues) {
                this.el.val(defaultValues);
            } else {
                this.el.val("");
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            let value = parseFloat(this.el.val());
            return _.isNaN(value) ? null : value.toFixed(this.precision);
        }

        return null;
    },

    checkCondition: function (condition, values) {
        switch (condition) {
            case 0:
                return this.values() == null;
            case 1:
                return this.values() != null;
            case 2:
                return this.values() === values;
            case 3:
                return this.values() !== values;
            default:
                return false;
        }
    },

    bindConditionListener: function(listeners, condition, values) {
        if (this.el && this.parent && !this.readOnly) {
            if (!this.bound) {
                this.el.on('input', $.proxy(this.onValueChanged, this));
                this.bound = true;
            }

            this.conditionType = condition;
            this.conditionValues = values;
            this.listeners = listeners || [];
        }
    },

    onValueChanged: function(e) {
        let display = this.checkCondition(this.conditionType, this.conditionValues);

        // show or hide the parent element
        if (display) {
            for (let i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().show(true);
            }
        } else {
            for (let i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().hide(true);
            }
        }
    }
});

let Numeric = require('./numeric');

NumericRange.DescriptorTypeDetailsView = Numeric.DescriptorTypeDetailsView.extend({
    template: require('../templates/widgets/numericrange.html'),

    ui: {
        'format_unit': '#format_unit',
        'format_unit_custom': '#format_unit_custom',
        'format_precision': '#format_precision',
        'format_range_min': '#format_range_min',
        'format_range_max': '#format_range_max'
    },

    events: {
        'change @ui.format_unit': 'changeFormatUnit',
        'input @ui.format_unit_custom': 'inputFormatUnitCustom'
    },

    onRender: function() {
        NumericRange.DescriptorTypeDetailsView.__super__.onRender.apply(this);

        this.ui.format_range_min.numeric({decimal: '.', negative: false});
        this.ui.format_range_max.numeric({decimal: '.', negative: false});

        let format = this.model.get('format');

        if (format.range !== undefined) {
            this.ui.format_range_min.val(format.range[0]);
            this.ui.format_range_max.val(format.range[1]);
        } else {
            this.ui.format_range_min.val("0.0");
            this.ui.format_range_max.val("100.0");
        }
    },

    getFormat: function() {
        let format = NumericRange.DescriptorTypeDetailsView.__super__.getFormat.apply(this);

        format.range = [
            this.ui.format_range_min.val(),
            this.ui.format_range_max.val()
        ];

        return format;
    }
});

module.exports = NumericRange;
