/**
 * @file gps.js
 * @brief Display and manage a GPS coordinate format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');

var GpsType = function() {
    DescriptorFormatType.call(this);

    this.name = "gps";
    this.group = "single";
};

_.extend(GpsType.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly) {
        readOnly || (readOnly = false);

        if (readOnly) {
            var input = this._createStdInput(parent, "glyphicon-screenshot");

            // hard limit to 1024 characters
            input.attr('maxlength', 1024);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            var group = $('<div class="input-group"></div>');
            var input = $('<input class="form-control" width="100%">');
            var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-screenshot"></span></span>');

            group.append(input);
            group.append(glyph);

            parent.append(group);

            // hard limit to 128 characters
            input.attr('maxlength', 128);

            this.parent = parent;
            this.el = input;
        }
    },

    destroy: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                this.el.parent().remove();
            }
        }
    },

    enable: function() {
        if (this.el) {
            this.el.prop("disabled", false);
        }
    },

    disable: function() {
        if (this.el) {
            this.el.prop("disabled", true);
        }
    },

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.el.val(defaultValues);
            }
        } else {
            if (definesValues) {
                this.el.val(defaultValues);
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            return this.el.val();
        }

        return null;
    },

    checkCondition: function (condition, values) {
        switch (condition) {
            case 0:
                return this.values() === "";
            case 1:
                return this.values() !== "";
            case 2:
                return this.values() === values;
            case 3:
                return this.values() !== values;
            default:
                return false;
        }
    },

    _validationHelper: function(input, type, comment) {
        // validation working on input-group only
        var el = input.parent().parent();

        if (!el.hasClass('has-feedback')) {
            el.addClass('has-feedback');
        }

        var help = input.parent().siblings('span.help-block');
        if (help.length == 0) {
            help = $('<span class="help-block"></span>');
            el.append(help);
        }

        if (type == -1) {
            el.addClass('has-error');
            input.addClass('invalid');

            help.show(false);
            help.text(comment);
        } else {
            el.removeClass('has-error');
            input.removeClass('invalid');

            help.hide(false);
            help.text("");
        }
    },
});

module.exports = GpsType;