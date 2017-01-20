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
}

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
            if (self.isInput) {
                var group = $('<div class="input-group"></div>');
                var input = $('<input class="form-control" width="100%">');
                var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-option-vertical"></span></span>');

                group.append(input);
                group.append(glyph);

                parent.append(group);

                this.parent = parent;
                this.el = input;
            } else {
                // ordinal with at max 256 values as a dropdown
                var select = $('<select data-width="100%"></select>');
                parent.append(select);

                select.selectpicker({container: 'body', style: 'btn-default'});

                this.parent = parent;
                this.el = select;
            }
        }
    },

    destroy: function() {
        if (this.el && this.parent && this.owned) {
            if (this.readOnly) {
                this.parent.remove(this.el.parent());
            } else {
                this.parent.remove(this.el);
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
            if (this.isInput) {
                $(this.el).numeric({
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

                if (definesValues) {
                    this.el.val(defaultValues[0]);
                }
            } else {

            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            return [parseInt(this.el.val())];
        }
    }
});

module.exports = Ordinal;