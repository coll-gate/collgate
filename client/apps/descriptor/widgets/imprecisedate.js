/**
 * @file date.js
 * @brief Display and manage an imprecise date format of type of descriptor
 * @author Medhi Boulnemour
 * @date 2017-04-11
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');
var Marionette = require('backbone.marionette');

var ImpreciseDateType = function () {
    DescriptorFormatType.call(this);

    this.name = "imprecise_date";
    this.group = "single";
};

_.extend(ImpreciseDateType.prototype, DescriptorFormatType.prototype, {
    create: function (format, parent, readOnly) {
        readOnly || (readOnly = false);

        if (readOnly) {
            var input = this._createStdInput(parent, "glyphicon-calendar");

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            var group = $('<div class="input-group"></div>');
            var input = $('<input class="form-control" width="100%">');
            var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>').css('cursor', 'pointer');

            group.append(input);
            group.append(glyph);

            parent.append(group);

            /// Partial datetime ///

            var accuracy = null;
            var current_date = null;

            var el = input.datetimepicker({
                locale: session.language,
                showClose: true,
                format: "L",
                showTodayButton: true,
                showClear: true,
                viewMode: 'years',
                icons: {
                    close: 'OK'
                }
            });

            var ok_button = null;
            var widget_picker = null;

            el.on("dp.show", function (e) {
                el.data('DateTimePicker').format("L");
                el.data('DateTimePicker').viewMode("years");

                // fix position when parent has overflow-y defined
                // https://github.com/Eonasdan/bootstrap-datetimepicker/issues/790
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

                widget_picker = dateTimePicker;

                var button = $('.OK').html(gt.gettext("Undefined")).css('display', 'none');
                button.on('click', function (e) {
                    if (accuracy === "YYYY") {
                        el.data('DateTimePicker').format("YYYY");
                        el.data('DateTimePicker').date(current_date);
                    } else if (accuracy === "M") {
                        el.data('DateTimePicker').format("MM/YYYY");
                        el.data('DateTimePicker').date(current_date);
                    } else {
                        el.data('DateTimePicker').format("L");
                    }
                });

                ok_button = button;

                var picker_view = dateTimePicker.find('.picker-switch');
                picker_view.on('click', function () {
                    if (dateTimePicker.find('.datepicker-days').css('display') === 'block') {
                        ok_button.css('display', 'block');
                    } else {
                        ok_button.css('display', 'none');
                    }
                });
            });

            el.on("dp.update", function (e) {
                accuracy = e.change;
                current_date = e.viewDate;

                if (widget_picker.find('.datepicker-days').css('display') === 'block') {
                    ok_button.css('display', 'block');
                } else if (widget_picker.find('.datepicker-months').css('display') === 'block') {
                    ok_button.css('display', 'block');
                } else {
                    ok_button.css('display', 'none');
                }
            });

            this.parent = parent;
            this.el = input;
        }
    },

    destroy: function () {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                this.el.data('DateTimePicker').destroy();
                this.el.parent().remove();
            }
        }
    },

    enable: function () {
        if (this.el) {
            this.el.data('DateTimePicker').enable();
        }
    },

    disable: function () {
        if (this.el) {
            this.el.data('DateTimePicker').disable();
        }
    },

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);
        var date = null;

        if (this.readOnly) {
            if (definesValues) {
                // defaultValues
                if (defaultValues[0] && !defaultValues[1] && !defaultValues[2]) {
                    // format: YYYY
                    // date = moment(defaultValues[0]);
                    date = moment(defaultValues[0] + "-01");
                    this.el.val(date.format("YYYY"));
                } else if (defaultValues[0] && defaultValues[1] && !defaultValues[2]) {
                    // format: MM/YYYY
                    date = moment(defaultValues[0] + "-" + defaultValues[1]);
                    this.el.val(date.format("MM/YYYY"));
                } else {
                    // format: L (ex: 20/05/1992)
                    date = moment(defaultValues[0] + defaultValues[1] + defaultValues[2]);
                    this.el.val(date.format("L"));
                }
            }
        } else {
            if (definesValues) {
                if (defaultValues[0] && !defaultValues[1] && !defaultValues[2]) {
                    // format: YYYY
                    date = moment(defaultValues[0] + "-01");
                    this.el.data('DateTimePicker').format("YYYY");
                } else if (defaultValues[0] && defaultValues[1] && !defaultValues[2]) {
                    // format: MM/YYYY
                    date = moment(defaultValues[0] + "-" + defaultValues[1]);
                    this.el.data('DateTimePicker').format("MM/YYYY");
                } else {
                    // format: L (ex: 20/05/1992)
                    date = moment(defaultValues[0] + defaultValues[1] + defaultValues[2]);
                    this.el.data('DateTimePicker').format("L");
                }
                this.el.data('DateTimePicker').date(date);
            }
        }
    },

    values: function () {
        if (this.el && this.parent) {
            if (this.readOnly) {
                var value = this.el.val();
                return value !== "" ? value : null;
            } else {
                var date = this.el.data('DateTimePicker').date();
                var format = this.el.data('DateTimePicker').format();
                if (date != null) {
                    switch (format) {
                        case "YYYY":
                            return [date.format("YYYY"), null, null];

                        case "MM/YYYY":
                            return [date.format("YYYY"), date.format("MM"), null];

                        case "L":
                            return [date.format("YYYY"), date.format("MM"), date.format("DD")];
                    }
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

    bindConditionListener: function (listeners, condition, values) {
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

    onValueChanged: function (e) {
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

ImpreciseDateType.DescriptorTypeDetailsView = Marionette.ItemView.extend({
    className: 'descriptor-type-details-format',
    template: "<div></div>",

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    getFormat: function () {
        return {}
    }
});

ImpreciseDateType.format = function (value) {
    if (value[0] !== null && value[1] !== null && value[2] !== null) {
        return moment(value[0] + value[1] + value[2]).format("L");
    } else if (value[0] !== null && value[1] !== null) {
        return moment(value[0] + value[1]).format("MM/YYYY");
    } else if (value[0] !== null) {
        return moment(value[0]).format("YYYY");
    } else {
        return ""
    }
};

module.exports = ImpreciseDateType;
