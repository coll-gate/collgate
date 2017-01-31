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
var Marionette = require('backbone.marionette');

var Boolean = function() {
    DescriptorFormatType.call(this);

    this.name = "boolean";
    this.group = "single";
};

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

            // true
            var option = $("<option></option>");

            option.attr("value", "true");
            option.html(gt.gettext('Yes'));

            select.append(option);

            // false
            option = $("<option></option>");

            option.attr("value", "false");
            option.html(gt.gettext('No'));

            select.append(option);

            select.selectpicker({container: 'body', style: 'btn-default'});

            this.parent = parent;
            this.el = select;
        }
    },

    destroy: function() {
        if (this.el && this.parent && this.owned) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                this.el.selectpicker('destroy');
                this.el.remove();
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
                this.el.val(defaultValues[0] ? gt.gettext('Yes') : gt.gettext('No')).attr('value', defaultValues[0]);

                if (defaultValues[0]) {
                    this.el.parent().children('span').children('span').addClass('glyphicon-check');
                } else {
                    this.el.parent().children('span').children('span').addClass('glyphicon-unchecked');
                }
            }
        } else {
            if (definesValues) {
                this.el.val(defaultValues[0] ? "true" : "false").trigger('change');
            }

            this.el.selectpicker('refresh');
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                return [this.el.attr("value") === "true"];
            } else {
                return [this.el.val() === "true"];
            }
        }

        return [false];
    },

    checkCondition: function(condition, values) {
        switch (condition) {
            case 0:
                return false;  // a boolean is always defined
            case 1:
                return true;   // a boolean is always defined
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
                this.el.parent('div.bootstrap-select').on('changed.bs.select', $.proxy(this.onValueChanged, this));
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

Boolean.DescriptorTypeDetailsView = Marionette.ItemView.extend({
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

module.exports = Boolean;