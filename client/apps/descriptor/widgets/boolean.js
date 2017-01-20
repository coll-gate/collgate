/**
 * @file boolean.js
 * @brief Display and manage a boolean format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');

var Boolean = function() {
    DescriptorFormatType.call(this);

    this.name = "boolean";
    this.group = "single";
}

_.extend(Boolean.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly, create) {
        readOnly || (readOnly = false);
        create || (create = true);

        this.owned = create;

        if (readOnly) {
            var input = null;

            if (create) {
                input = this._createStdInput(parent, "glyphicon-check");
            } else {
                input = parent.children('input');
            }

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            var select = $('<select data-width="100%"></select>');
            parent.append(select);

            select.selectpicker({container: 'body', style: 'btn-default'});

            this.parent = parent;
            this.el = select;
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
            this.el.prop("disabled", false).selectpicker('refresh');
        }
    },

    disable: function() {
        if (this.el) {
            this.el.prop("disabled", true).selectpicker('refresh');
        }
    },

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.el.val(defaultValues[0] ? gt.gettext('Yes') : gt.gettext('No'));

                if (defaultValues[0]) {
                    this.el.parent().children('span').children('span').addClass('glyphicon-check');
                } else {
                    this.el.parent().children('span').children('span').addClass('glyphicon-unchecked');
                }
            }
        } else {
            // true
            var option = $("<option></option>");

            option.attr("value", "true");
            option.html(gt.gettext('Yes'));

            this.el.append(option);

            // false
            option = $("<option></option>");

            option.attr("value", "false");
            option.html(gt.gettext('No'));

            this.el.append(option);

            if (definesValues) {
                this.el.val(defaultValues[0] ? "true" : "false").trigger('change');
            }

            this.el.selectpicker('refresh');
        }
    },

    values: function() {
        if (this.el && this.parent) {
            return [this.el.val() === "true"];
        }
    }
});

module.exports = Boolean;