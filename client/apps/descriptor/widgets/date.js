/**
 * @file date.js
 * @brief Display and manage a date format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorFormatType = require('./descriptorformattype');
let Marionette = require('backbone.marionette');

let DateType = function() {
    DescriptorFormatType.call(this);

    this.name = "date";
    this.group = "single";
};

_.extend(DateType.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly) {
        readOnly || (readOnly = false);

        if (readOnly) {
            let input = this._createStdInput(parent, "glyphicon-calendar");

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            let group = $('<div class="input-group"></div>');
            let input = $('<input class="form-control" width="100%">');
            let glyph = $('<span class="input-group-addon"><span class="fa fa-calendar"></span></span>').css('cursor', 'pointer');

            group.append(input);
            group.append(glyph);

            parent.append(group);

            input.datetimepicker({
                locale: session.language,
                format: $.datepicker._defaults.dateFormat.toUpperCase(),
                showTodayButton: true,
                showClear: true,
                allowInputToggle: true
                //widgetParent:   // view.$el,
                //widgetPositioning: {
                //    vertical: 'auto',
                //    horizontal: 'auto'
                //}
            }).on('dp.show', function (e) {
                // fix position when parent has overflow-y defined
                // https://github.com/Eonasdan/bootstrap-datetimepicker/issues/790
                let dateTimePicker = $('body').find('.bootstrap-datetimepicker-widget:last'),
                    position = dateTimePicker.offset(),
                    parent = dateTimePicker.parent(),
                    parentPos = parent.offset(),
                    width = dateTimePicker.width(),
                    parentWid = parent.width();

                // move dateTimePicker to the exact same place it was but attached to body
                dateTimePicker.appendTo('body');
                dateTimePicker.css({
                    position: 'absolute',
                    top: position.top,
                    bottom: 'auto',
                    left: position.left,
                    right: 'auto',
                    'z-index': 10001
                });

                // if dateTimePicker is wider than the thing it is attached to then move it so the centers line up
                if (parentPos.left + parentWid < position.left + width) {
                    let newLeft = parentPos.left;
                    newLeft += parentWid / 2;
                    newLeft -= width / 2;
                    dateTimePicker.css({left: newLeft});
                }
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
                this.el.data('DateTimePicker').destroy();
                this.el.parent().remove();
            }
        }
    },

    enable: function() {
        if (this.el) {
            this.el.data('DateTimePicker').enable();
        }
    },

    disable: function() {
        if (this.el) {
            this.el.data('DateTimePicker').disable();
        }
    },

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                let date = moment(defaultValues);
                this.el.val(date.format("L"));
                this.el.attr('value', defaultValues);
            }
        } else {
            if (definesValues) {
                let date = moment(defaultValues);
                this.el.data('DateTimePicker').date(date);
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                let value = this.el.attr('value');
                return value !== "" ? value : null;
            } else {
                let date = this.el.data('DateTimePicker').date();
                if (date != null) {
                    // format to YYYYMMDD date
                    return date.format("YYYYMMDD");
                } else {
                    return null;
                }
            }
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
                this.el.parent().on('dp.change', $.proxy(this.onValueChanged, this));
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

DateType.DescriptorTypeDetailsView = Marionette.View.extend({
    className: 'descriptor-type-details-format',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    getFormat: function() {
        return {}
    }
});

DateType.format = function (value) {
    return moment(value).format("L");
};

module.exports = DateType;
