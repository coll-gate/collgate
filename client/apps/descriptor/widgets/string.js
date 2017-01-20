/**
 * @file string.js
 * @brief Display and manage a string format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('./descriptorformattype');

var StringType = function() {
    DescriptorFormatType.call(this);

    this.name = "string";
    this.group = "single";
}

_.extend(StringType.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly, create) {
        readOnly || (readOnly = false);
        create || (create = true);

        this.owned = create;

        if (readOnly) {
            var input = null;

            if (create) {
                input = this._createStdInput(parent, "glyphicon-font");
            } else {
                input = parent.children('input');
            }

            // hard limit to 1024 characters
            input.attr('maxlength', 1024);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            var group = $('<div class="input-group"></div>');
            var input = $('<input class="form-control" width="100%">');
            var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-font"></span></span>');

            group.append(input);
            group.append(glyph);

            parent.append(group);

            // hard limit to 1024 characters
            input.attr('maxlength', 1024);

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
                this.el.val(defaultValues[0]);
            }
        } else {
            if (typeof format.regexp !== "undefined") {
                this.el.on("input", function(e) {
                    // check regexp and max length of 1024
                    var val = $(e.target).val();
                    var re = new RegExp(format.regexp);
                    var el = $(e.target);

                    if (val.length > 1024) {
                        this._validationHelper(el, -1, gt.gettext("1024 characters max"));
                    } else if (!re.test(val)) {
                        this._validationHelper(el, -1, gt.gettext("Invalid format"));
                    } else {
                        this._validationHelper(el, 0, null);
                    }

                    return true;
                });
            } else {
                this.el.on("input", function(e) {
                    var val = $(e.target).val();
                    var el = $(e.target);

                    // hard limit to 1024 characters
                    if (val.length > 1024) {
                        this._validationHelper(el, -1, gt.gettext("1024 characters max"));
                    } else {
                        this._validationHelper(el, 0, null);
                    }

                    return true;
                });
            }

            if (definesValues) {
                this.el.val(defaultValues[0]);
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            return [this.el.val()];
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

module.exports = StringType;