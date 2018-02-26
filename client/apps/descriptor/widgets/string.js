/**
 * @file string.js
 * @brief Display and manage a string format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorFormatType = require('./descriptorformattype');
let DescribableValueHistoryDialog = require('../views/describablevaluehistory');
let Marionette = require('backbone.marionette');

let StringType = function() {
    DescriptorFormatType.call(this);

    this.name = "string";
    this.group = "single";
};

_.extend(StringType.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, options) {
        options || (options = {
            readOnly: false,
            history: false
        });

        if (options.readOnly) {
            let input = this._createStdInput(parent, "fa-font", options.history);

            // hard limit to 1024 characters
            input.attr('maxlength', 1024);

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            let input = $('<input class="form-control" width="100%">');
            let clean = $('<span class="form-clean-btn action fa fa-eraser"></span>');
            this.groupEl = this._createInputGroup(parent, "fa-font", input, options.history);

            clean.insertAfter(input);

            if (options.history) {
                // adjust position
                clean.css('right', '90px');
            }

            clean.on('click', function() {
               input.val("");
            });

            // hard limit to 1024 characters
            input.attr('maxlength', 1024);

            if (typeof format.regexp !== "undefined") {
                input.on("input", function(e) {
                    // check regexp and max length of 1024
                    let val = $(e.target).val();
                    let re = new RegExp(format.regexp);
                    let el = $(e.target);

                    if (val.length > 1024) {
                        StringType.prototype._validationHelper(el, -1, _t('characters_max', {count: 1024}));
                    } else if (!re.test(val)) {
                        StringType.prototype._validationHelper(el, -1, _t("Invalid format"));
                    } else {
                        StringType.prototype._validationHelper(el, 0, null);
                    }

                    return true;
                });
            } else {
                input.on("input", function(e) {
                    let val = $(e.target).val();
                    let el = $(e.target);

                    // hard limit to 1024 characters
                    if (val.length > 1024) {
                        StringType.prototype._validationHelper(el, -1, _t('characters_max', {count: 1024}));
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

    set: function (format, definesValues, defaultValues, options) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.el.val(defaultValues);
            } else {
                this.el.val("");
            }
        } else {
            if (definesValues) {
                this.el.val(defaultValues);
            } else {
                this.el.val("");
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            let value = this.el.val();
            return value !== "" ? value : null;
        }

        return null;
    },

    checkCondition: function (condition, values) {
        switch (condition) {
            case 0:
                return this.values() === null;
            case 1:
                return this.values() !== null;
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
    },

    _validationHelper: function(input, type, comment) {
        // validation working on input-group only
        let el = input.parent().parent();

        if (!el.hasClass('has-feedback')) {
            el.addClass('has-feedback');
        }

        let help = input.parent().siblings('span.help-block');
        if (help.length === 0) {
            help = $('<span class="help-block"></span>');
            el.append(help);
        }

        if (type === -1) {
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

    showHistory: function(appLabel, modelName, objectId, valueName, descriptor, options) {
        options || (options = {});

        // refresh values
        this.promise = $.ajax({
            url: window.application.url(['audit', 'search', 'history', 'value']),
            dataType: 'json',
            data: {
                app_label: appLabel,
                model: modelName,
                object_id: objectId,
                value: valueName
            }
        }).done(function (data) {
            let dialog = new DescribableValueHistoryDialog({
                entries: data.items,
                readOnly: this.readOnly,
                descriptor: descriptor
            });

            dialog.render();
        });
    }
});

StringType.DescriptorTypeDetailsView = Marionette.View.extend({
    className: 'descriptor-type-details-format',
    template: require('../templates/widgets/string.html'),

    ui: {
        'format_regexp': '#format_regexp'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        let format = this.model.get('format');

        this.ui.format_regexp.val(format.regexp);
    },

    getFormat: function() {
        return {
            'regexp': this.ui.format_regexp.val()
        }
    }
});

module.exports = StringType;
