/**
 * @file ordinal.js
 * @brief Display and manage an ordinal format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');

var Ordinal = function() {
    DescriptorFormatType.call(this);

    this.name = "ordinal";
    this.group = "single";
};

_.extend(Ordinal.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly, create) {
        readOnly || (readOnly = false);
        create || (create = true);

        this.owned = create;

        if ((format.range[1] - format.range[0] + 1) <= 256) {
            this.isInput = false;
        } else {
            this.isInput = true;
        }

        if (readOnly) {
            var input = null;

            if (create) {
                input = this._createStdInput(parent, "glyphicon-option-vertical");
            } else {
                input = parent.children('input');
            }

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            if (this.isInput) {
                var group = $('<div class="input-group"></div>');
                var input = $('<input class="form-control" width="100%">');
                var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-option-vertical"></span></span>');

                group.append(input);
                group.append(glyph);

                parent.append(group);

                input.numeric({
                    allowPlus: false,
                    allowMinus: format.range[0] < 0,
                    allowThouSep: false,
                    allowDecSep: false,
                    allowLeadingSpaces: false,
                    maxDigits: NaN,
                    maxDecimalPlaces: NaN,
                    maxPreDecimalPlaces: NaN,
                    max: format.range[1],
                    min: format.range[0]
                });

                this.parent = parent;
                this.el = input;
            } else {
                // ordinal with at max 256 values as a dropdown
                var select = $('<select data-width="100%"></select>');
                parent.append(select);

                for (var i = format.range[0]; i <= format.range[1]; ++i) {
                    var option = $("<option></option>");

                    option.attr("value", i);
                    option.html(i);

                    select.append(option);
                }

                select.selectpicker({container: 'body', style: 'btn-default'});

                this.parent = parent;
                this.el = select;
            }
        }
    },

    destroy: function() {
        if (this.el && this.parent && this.owned) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                if (this.isInput) {
                    this.el.parent().remove();
                } else {
                    this.el.selectpicker('destroy');
                    this.el.remove();
                }
            }
        }
    },

    enable: function() {
        if (this.el) {
            this.el.prop("disabled", false);

            if (this.isInput) {
                this.el.selectpicker('refresh');
            }
        }
    },

    disable: function() {
        if (this.el) {
            this.el.prop("disabled", true);

            if (this.isInput) {
                this.selectpicker('refresh');
            }
        }
    },

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.el.val(defaultValues[0]);
            }
        } else {
            if (definesValues) {
                if (this.isInput) {
                    this.el.val(defaultValues[0]);
                } else {
                    this.el.val(defaultValues[0].toString()).trigger('change');
                    this.el.selectpicker('refresh');
                }
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.el.val() !== "") {
                var value = parseInt(this.el.val());
                return [isNaN(value) ? null : value];
            } else {
                return [null];
            }
        }

        return [null]
    },

    checkCondition: function (condition, values) {
        switch (condition) {
            case 0:
                return this.values()[0] === null;
            case 1:
                return this.values()[0] !== null;
            case 2:
                return this.values()[0] === values[0];
            case 3:
                return this.values()[0] !== values[0];
            default:
                return false;
        }
    },

    bindConditionListener: function(listeners, condition, values) {
        if (this.el && this.parent && !this.readOnly) {
            if (!this.bound) {
                if (this.isInput) {
                    this.el.on('input', $.proxy(this.onValueChanged, this));
                } else {
                    this.el.parent('div.bootstrap-select').on('changed.bs.select', $.proxy(this.onValueChanged, this));
                }

                this.bound = true;
            }

            this.conditionType = condition;
            this.conditionValues = values;
            this.listeners = listeners || [];
        }
    },

    onValueChanged: function(e) {
        var display = this.checkCondition(this.conditionType, this.conditionValues);

        // show or hide the parent element
        if (display) {
            for (var i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().show(true);
            }
        } else {
            for (var i = 0; i < this.listeners.length; ++i) {
                this.listeners[i].parent.parent().hide(true);
            }
        }
    }
});

var Numeric = require('./numeric');

Ordinal.DescriptorTypeDetailsView = Numeric.DescriptorTypeDetailsView.extend({
    template: require('../templates/widgets/ordinal.html'),

    ui: {
        'format_unit': '#format_unit',
        'format_unit_custom': '#format_unit_custom',
        'format_range_min': '#format_range_min',
        'format_range_max': '#format_range_max'
    },

    events: {
        'change @ui.format_unit': 'changeFormatUnit',
        'input @ui.format_unit_custom': 'inputFormatUnitCustom'
    },

    onRender: function() {
        // same as numeric excepted the precision
        application.descriptor.views.formatUnits.drawSelect(this.ui.format_unit);

        var format = this.model.get('format');

        if (format.unit != undefined) {
            this.ui.format_unit.selectpicker('val', format.unit);
        }

        this.ui.format_range_min.numeric({decimal : false, negative : false});
        this.ui.format_range_max.numeric({decimal : false, negative : false});

        var format = this.model.get('format');

        if (format.range !== undefined) {
            this.ui.format_range_min.val(format.range[0]);
            this.ui.format_range_max.val(format.range[1]);
        } else {
            this.ui.format_range_min.val("0");
            this.ui.format_range_max.val("10");
        }
    },

    getFormat: function() {
        var customUnit = this.ui.format_unit.val() === "custom" ? this.ui.format_unit_custom.val() : "";

        return {
            'unit': this.ui.format_unit.val(),
            'custom_unit': customUnit,
            'range': [
                this.ui.format_range_min.val(),
                this.ui.format_range_max.val()
            ]
        };
    }
});

module.exports = Ordinal;