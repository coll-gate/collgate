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
var Marionette = require('backbone.marionette');

var StringType = function() {
    DescriptorFormatType.call(this);

    this.name = "string";
    this.group = "single";
};

_.extend(StringType.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly) {
        readOnly || (readOnly = false);

        if (readOnly) {
            var input = this._createStdInput(parent, "glyphicon-font");

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

            if (typeof format.regexp !== "undefined") {
                input.on("input", function(e) {
                    // check regexp and max length of 1024
                    var val = $(e.target).val();
                    var re = new RegExp(format.regexp);
                    var el = $(e.target);

                    if (val.length > 1024) {
                        StringType.prototype._validationHelper(el, -1, gt.gettext("1024 characters max"));
                    } else if (!re.test(val)) {
                        StringType.prototype._validationHelper(el, -1, gt.gettext("Invalid format"));
                    } else {
                        StringType.prototype._validationHelper(el, 0, null);
                    }

                    return true;
                });
            } else {
                input.on("input", function(e) {
                    var val = $(e.target).val();
                    var el = $(e.target);

                    // hard limit to 1024 characters
                    if (val.length > 1024) {
                        StringType.prototype._validationHelper(el, -1, gt.gettext("1024 characters max"));
                    } else {
                        StringType.prototype._validationHelper(el, 0, null);
                    }

                    return true;
                });
            }

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

        return "";
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

    bindConditionListener: function(listeners, condition, values) {
        if (this.el && this.parent && !this.readOnly) {
            if (!this.bound) {
                this.el.on('input', $.proxy(this.onValueChanged, this));
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

StringType.DescriptorTypeDetailsView = Marionette.ItemView.extend({
    className: 'descriptor-type-details-format',
    template: require('../templates/widgets/string.html'),

    ui: {
        'format_regexp': '#format_regexp'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        var format = this.model.get('format');

        this.ui.format_regexp.val(format.regexp);
    },

    getFormat: function() {
        return {
            'regexp': this.ui.format_regexp.val()
        }
    }
});

module.exports = StringType;