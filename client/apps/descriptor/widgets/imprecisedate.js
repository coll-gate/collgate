/**
 * @file imprecisedate.js
 * @brief Display and manage an imprecise date format of type of descriptor
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-04-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorFormatType = require('./descriptorformattype');
let Marionette = require('backbone.marionette');

let ImpreciseDateType = function () {
    DescriptorFormatType.call(this);

    this.name = "imprecise_date";
    this.group = "single";
    this.display_el = null;
};

_.extend(ImpreciseDateType.prototype, DescriptorFormatType.prototype, {
    create: function (format, parent, options) {
        options || (options = {
            history: false,
            readOnly: false
        });

        if (options.readOnly) {
            let input = this._createStdInput(parent, "fa-calendar", options.history);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            // hidden input
            let input = $('<input class="form-control" width="100%">').css({
                    height: '0px',
                    visibility: 'hidden',
                    padding: '0px',
                    border: 'none'
            });

            // proxy input
            let display_input = $('<input class="form-control" width="100%" pattern="[0-9\/\s]+">');
            this.groupEl = this._createInputGroup(parent, "fa-calendar", [display_input, input], options.history);

            //
            // Partial datetime
            //

            let accuracy = null; // 0: nothing, 1: year, 2: year-month, 3: year-month-day
            let current_date = null;

            let el = input.datetimepicker({
                locale: window.session.language,
                showClose: true,
                format: "L",
                showTodayButton: true,
                showClear: true,
                viewMode: 'years',
                minDate: '0001-01-01',
                maxDate: '9999-12-31',
                icons: {
                    close: 'OK'
                },
                // widgetPositioning: {
                //    vertical: 'auto',
                //    horizontal: 'auto'
                // }
            });

            let lastFocusedElement = null;

            display_input.mousedown(function(e) {
                // To prevent case when element already had focus
                 if (lastFocusedElement === e.target) {
                     el.data('DateTimePicker').show();
                 }
            }).focus(function(e){
                el.data('DateTimePicker').show();
                lastFocusedElement = e.target;
            }).blur(function(e) {
                el.data('DateTimePicker').hide();
                lastFocusedElement = null;
            });

            display_input.on('keydown', function (e) {
                // Allow: backspace, delete, tab, escape, dash, enter, slash and .
                if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 109, 110, 111, 190]) !== -1 ||
                    // Allow: Ctrl+A, Command+A
                    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                    // Allow: home, end, left, right, down, up
                    (e.keyCode >= 35 && e.keyCode <= 40)) {
                    // let it happen, don't do anything
                    return;
                }
                // Ensure that it is a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });

            display_input.on('change', function (e) {
                // define date accuracy
                let temp = (display_input.val().match(/[\/\-.]/g) || []).length;
                if (!display_input.val()) {
                    accuracy = 0;
                    current_date = null;
                    el.data('DateTimePicker').format("L");
                    el.data('DateTimePicker').date(current_date);
                } else if (temp === 2) {
                    accuracy = 3;
                    current_date = moment(display_input.val(), "L");
                    el.data('DateTimePicker').format("L");
                    el.data('DateTimePicker').date(current_date);
                    display_input.val(el.data('DateTimePicker').date().format("L"));
                } else if (temp === 1) {
                    accuracy = 2;
                    current_date = moment(display_input.val(), "MM/YYYY");
                    el.data('DateTimePicker').format("MM/YYYY");
                    el.data('DateTimePicker').date(current_date);
                    display_input.val(el.data('DateTimePicker').date().format("MM/YYYY"));
                } else {
                    accuracy = 1;
                    current_date = moment(display_input.val(), "YYYY");
                    el.data('DateTimePicker').format("YYYY");
                    el.data('DateTimePicker').date(current_date);
                    display_input.val(el.data('DateTimePicker').date().format("YYYY"));
                }
                el.data('DateTimePicker').hide();
            });

            el.on('dp.hide', function(e) {
                display_input.trigger('change');
            });

            el.on("dp.change", function(e){
                if (!el.data('DateTimePicker').date()) {
                    display_input.val("");
                } else if (el.data('DateTimePicker').format() === "YYYY") {
                    display_input.val(el.data('DateTimePicker').date().format("YYYY"));
                } else if (el.data('DateTimePicker').format() === "MM/YYYY") {
                    display_input.val(el.data('DateTimePicker').date().format("MM/YYYY"));
                } else if (el.data('DateTimePicker').format() === "L") {
                    display_input.val(el.data('DateTimePicker').date().format("L"));
                }
            });

            let ok_button = null;
            let widget_picker = null;

            el.on("dp.show", function (e) {
                el.data('DateTimePicker').format("L");
                el.data('DateTimePicker').viewMode("years");

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
                    top: position.top + ((position.top < parentPos.top) ? -display_input.outerHeight() : 0),
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

                widget_picker = dateTimePicker;

                let button = $('.OK').html(_t("Undefined")).css('display', 'none');
                button.on('click', function (e) {
                    if (accuracy === 1) {
                        el.data('DateTimePicker').format("YYYY");
                        el.data('DateTimePicker').date(current_date);
                        display_input.val(el.data('DateTimePicker').date().format("YYYY"));
                    } else if (accuracy === 2) {
                        el.data('DateTimePicker').format("MM/YYYY");
                        el.data('DateTimePicker').date(current_date);
                        display_input.val(el.data('DateTimePicker').date().format("MM/YYYY"));
                    } else if (el.data('DateTimePicker').date() === null) {
                        accuracy = 0;
                    }
                });

                ok_button = button;

                // manage (undefined/ok) button visibility 1st part
                let picker_view = dateTimePicker.find('.picker-switch');
                picker_view.on('click', function () {
                    if (dateTimePicker.find('.datepicker-days').css('display') === 'block') {
                        accuracy = 1; // fix accuracy of the date
                        ok_button.css('display', 'block');
                    } else {
                        ok_button.css('display', 'none');
                    }
                });
            });

            el.on("dp.update", function (e) {
                // set accuracy of the date
                if (e.change === 'YYYY') {
                    accuracy = 1;
                } else if (e.change === 'M') {
                    accuracy = 2;
                } else {
                    accuracy = 0;
                }

                //set the current date
                current_date = e.viewDate;

                // manage (undefined/ok) button visibility 2nd part
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
            this.display_el = display_input;
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

    set: function (format, definesValues, defaultValues, options) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);
        let date = null;

        if (this.readOnly) {
            if (definesValues) {
                // defaultValues
                date = moment();
                date.locale(session.language);
                if (defaultValues[0] && !defaultValues[1] && !defaultValues[2]) {
                    // format: YYYY
                    date.year(defaultValues[0]);
                    this.el.val(date.format("YYYY"));
                } else if (defaultValues[0] && defaultValues[1] && !defaultValues[2]) {
                    // format: MM/YYYY
                    date.year(defaultValues[0]);
                    date.month(defaultValues[1] - 1);
                    this.el.val(date.format("MM/YYYY"));
                } else if (defaultValues[0] && defaultValues[1] && defaultValues[2]) {
                    // format: L (ex: 20/05/1992)
                    date.year(defaultValues[0]);
                    date.month(defaultValues[1] - 1);
                    date.date(defaultValues[2]);
                    this.el.val(date.format("L"));
                }
            } else {
                this.el.val("");
                this.el.attr('value', "");
            }
        } else {
            if (definesValues) {
                date = moment();
                if (defaultValues[0] && !defaultValues[1] && !defaultValues[2]) {
                    // format: YYYY
                    date.year(defaultValues[0]);
                    this.el.data('DateTimePicker').format("YYYY");
                    this.display_el.val(date.format("YYYY"));
                } else if (defaultValues[0] && defaultValues[1] && !defaultValues[2]) {
                    // format: MM/YYYY
                    date.year(defaultValues[0]);
                    date.month(defaultValues[1] - 1);
                    this.el.data('DateTimePicker').format("MM/YYYY");
                    this.display_el.val(date.format("MM/YYYY"));
                } else if (defaultValues[0] && defaultValues[1] && defaultValues[2]) {
                    // format: L (ex: 20/05/1992)
                    date.year(defaultValues[0]);
                    date.month(defaultValues[1] - 1);
                    date.date(defaultValues[2]);
                    this.el.data('DateTimePicker').format("L");
                    this.display_el.val(date.format("L"));
                }
                this.el.data('DateTimePicker').date(date);
            } else {
                this.el.data('DateTimePicker').clear();
            }
        }
    },

    values: function () {
        if (this.el && this.parent) {
            if (this.readOnly) {
                let value = this.el.val();
                return value !== "" ? value : null;
            } else {
                let date = this.el.data('DateTimePicker').date();
                let format = this.el.data('DateTimePicker').format();
                if (date != null) {
                    switch (format) {
                        case "YYYY":
                            return [parseInt(date.format("YYYY")), 0, 0];

                        case "MM/YYYY":
                            return [parseInt(date.format("YYYY")), parseInt(date.format("MM")), 0];

                        case "L":
                            return [parseInt(date.format("YYYY")), parseInt(date.format("MM")), parseInt(date.format("DD"))];
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

ImpreciseDateType.DescriptorTypeDetailsView = Marionette.View.extend({
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
    if (value === null || value === undefined) {
        return "";
    } else if (value[0] !== 0 && value[1] !== 0 && value[2] !== 0) {
        return moment().locale(session.language).year(value[0]).month(value[1]-1).date(value[2]).format("L");
    } else if (value[0] !== 0 && value[1] !== 0) {
        return moment().locale(session.language).year(value[0]).month(value[1]-1).format("MM/YYYY");
    } else if (value[0] !== 0) {
        return moment().locale(session.language).year(value[0]).format("YYYY");
    } else {
        return ""
    }
};

module.exports = ImpreciseDateType;
