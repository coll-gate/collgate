/**
 * @file boolean.js
 * @brief Display and manage a boolean format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorFormatType = require('./descriptorformattype');
let Marionette = require('backbone.marionette');

let BooleanType = function() {
    DescriptorFormatType.call(this);

    this.name = "boolean";
    this.group = "single";
};

_.extend(BooleanType.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, options) {
        options || (options = {
            history: false,
            readOnly: false
        });

        if (options.readOnly) {
            let input = this._createStdInput(parent, "fa-check", options.history);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            let select = $('<select data-width="100%"></select>');
            this.groupEl = this._createInputGroup(parent, "fa-check", select, options.history);

            // undefined
            let option = $("<option></option>");

            option.attr("value", "null");
            option.html(' - ' + _t('Undefined') + ' - ');

            select.append(option);

            // true
            option = $("<option></option>");

            option.attr("value", "true");
            option.html(_t('Yes'));

            select.append(option);

            // false
            option = $("<option></option>");

            option.attr("value", "false");
            option.html(_t('No'));

            select.append(option);

            select.selectpicker({container: 'body', style: 'btn-default'});

            this.parent = parent;
            this.el = select;
        }
    },

    destroy: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                this.el.selectpicker('destroy');
                this.groupEl.remove();
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

    set: function (format, definesValues, defaultValues, options) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.el.val(defaultValues ? _t('Yes') : _t('No')).attr('value', defaultValues);

                if (defaultValues === true) {
                    this.el.parent().children('span').children('span').addClass('fa-check-square-o');
                } else {
                    this.el.parent().children('span').children('span').addClass('fa-square-o');
                }
            } else {
                this.el.val("").attr("null");
                this.el.parent().children('span').children('span').addClass('fa-square-o');
            }
        } else {
            if (definesValues) {
                this.el.val(defaultValues ? "true" : "false").trigger('change');
            } else {
                this.el.val("null");
            }

            this.el.selectpicker('refresh');
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                let attr = this.el.attr("value");
                if (attr === "null") {
                    return null;
                } else {
                    return attr === "true";
                }
            } else {
                let val = this.el.val();
                if (val === "null") {
                    return null;
                } else {
                    return val === "true";
                }
            }
        }

        return false;
    },

    checkCondition: function(condition, values) {
        switch (condition) {
            case 0:
                return this.values() === null;   // false;  // a boolean is always defined
            case 1:
                return this.value() !== null;   // true;   // a boolean is always defined
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
                this.el.parent('div.bootstrap-select').on('changed.bs.select', $.proxy(this.onValueChanged, this));
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

BooleanType.DescriptorTypeDetailsView = Marionette.View.extend({
    className: 'descriptor-type-details-format',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    getFormat: function() {
        return {
        }
    }
});

module.exports = BooleanType;
