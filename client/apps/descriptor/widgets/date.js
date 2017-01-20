/**
 * @file date.js
 * @brief Display and manage a date format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');

var DateType = function() {
    DescriptorFormatType.call(this);

    this.name = "date";
    this.group = "single";
}

_.extend(DateType.prototype, DescriptorFormatType.prototype, {
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
                this.parent.remove(this.el);
            }
        }
    },

    enable: function() {
        if (this.el) {
            this.el.parent().data('DateTimePicker').enable();
        }
    },

    disable: function() {
        if (this.el) {
            this.el.parent().data('DateTimePicker').disable();
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
                this.el.val(date.format($.datepicker._defaults.dateFormat.toUpperCase()));
            }
        } else {
            this.el.datetimepicker({
                locale: session.language,
                format: $.datepicker._defaults.dateFormat.toUpperCase(),
                showTodayButton: true,
                showClear: true,
                allowInputToggle: true
                //widgetParent: view.$el,
                //widgetPositioning: {
                //    vertical: 'auto',
                //    horizontal: 'auto'
                //}
            }).on('dp.show', function (e) {
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
            });

            if (definesValues) {
                var date = moment(defaultValues[0]);
                this.el.val(date.format($.datepicker._defaults.dateFormat.toUpperCase()));
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            var date = this.el.parent().data('DateTimePicker').date();
            if (date != null) {
                // format to YYYYMMDD date
                return [date.format("YYYYMMDD")];
            } else {
                return [""]
            }
        }
    }
});

module.exports = DateType;