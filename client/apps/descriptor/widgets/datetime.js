/**
 * @file datetime.js
 * @brief Display and manage a date+time format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');

var DateTimeType = function() {
    DescriptorFormatType.call(this);

    this.name = "datetime";
    this.group = "single";
}

_.extend(DateTimeType.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly, create) {
        readOnly || (readOnly = false);
        create || (create = true);

        this.owned = create;

        if (readOnly) {
            var input = null;

            if (create) {
                input = this._createStdInput(parent, "glyphicon-calendar");
            } else {
                input = parent.children('input');
            }

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            var group = $('<div class="input-group"></div>');
            var input = $('<input class="form-control" width="100%">');
            var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>').css('cursor', 'pointer');;

            group.append(input);
            group.append(glyph);

            parent.append(group);

            this.parent = parent;
            this.el = input;
        }
    },

    destroy: function() {
        if (this.el && this.parent && this.owned) {
            if (this.readOnly) {
                this.parent.remove(this.el.parent());
            } else {
                this.el.data('DateTimePicker').destroy();
                this.parent.remove(this.el.parent());
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
                var date = moment(defaultValues[0]);
                this.el.val(date.format($.datepicker._defaults.dateFormat.toUpperCase() + ' HH:mm:ss'));
            }
        } else {
            this.el.datetimepicker({
                locale: session.language,
                format: $.datepicker._defaults.dateFormat.toUpperCase() + ' HH:mm:ss',  // 24h
                showTodayButton: true,
                showClear: true,
                allowInputToggle: true
            }).on('dp.show', function (e) {
                // fix position when parent has overflow-y defined
                var dateTimePicker = $('body').find('.bootstrap-datetimepicker-widget:last'),
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
                    var newLeft = parentPos.left;
                    newLeft += parentWid / 2;
                    newLeft -= width / 2;
                    dateTimePicker.css({left: newLeft});
                }
            });

            if (definesValues) {
                var date = moment(defaultValues[0]);
                this.el.data('DateTimePicker').date(date);
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                return [this.el.val()];
            } else {
                // format to YYYYMMDD date
                var date = this.el.data('DateTimePicker').date();
                if (date != null) {
                    // format to iso datetime
                    return [date.format()];
                } else {
                    return [""];
                }
            }
        }

        return [""];
    },

    checkCondition: function (condition, values) {
        switch (condition) {
            case 0:
                return this.values()[0] === "";
            case 1:
                return this.values()[0] !== "";
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
                this.el.parent().on('dp.change', $.proxy(this.onValueChanged, this));
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

module.exports = DateTimeType;