/**
 * @file mediacollection.js
 * @brief Display and manage a collection of medias format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-25
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
var Marionette = require('backbone.marionette');

var MediaCollection = function() {
    DescriptorFormatType.call(this);

    this.name = "media_collection";
    this.group = "media";
};

_.extend(MediaCollection.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly) {
        readOnly || (readOnly = false);

        if (readOnly) {
            var input = this._createStdInput(parent, "glyphicon-check");

            this.parent = parent;
            this.readOnly = true;
            this.el = input;
        } else {
            /* @todo */

            this.parent = parent;
            this.el = select;
        }
    },

    destroy: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                /*this.el.remove(); @todo */
            }
        }
    },

    cancel: function() {
        /* @todo */
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

    set: function (format, definesValues, defaultValues) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.values = defaultValues;

                /* @todo */
            }
        } else {
            if (definesValues) {
                this.initials = this.values = defaultValues;

                /* @todo */
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                return [this.el.attr("value")];
            } else {
                return [this.el.val()];
            }
        }

        return [];
    },

    compare: function(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            return false;
        }

        if (a.length != b.length) {
            return false;
        }

        var found = false;

        for (var i = 0; i < a.length; ++i) {
            found = false;
            for (var j = 0; j < b.length; ++j) {
                if (a[i] === b[j]) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                return false;
            }
        }
    },

    checkCondition: function(condition, values) {
        switch (condition) {
            case 0:
                return this.values == null || this.values.length == 0;
            case 1:
                return this.values != null && this.values.length > 0;
            case 2:
                return this.compare(this.values, values);
            case 3:
                return !this.compare(this.values, values);
            default:
                return false;
        }
    },

    bindConditionListener: function(listeners, condition, values) {
        if (this.el && this.parent && !this.readOnly) {
            if (!this.bound) {
                /* @todo */
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

MediaCollection.DescriptorTypeDetailsView = Marionette.ItemView.extend({
    className: 'descriptor-type-details-format',
    template: require('../templates/widgets/mediacollection.html'),

    ui: {
        format_media_types: '#format_media_types',
        format_max_items: '#format_max_items',
        format_media_inline: '#format_media_inline'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        this.ui.format_media_types.selectpicker({
            style: 'btn-default',
            container: 'body'
        });

        this.ui.format_media_inline.selectpicker({style: 'btn-default'});

        var format = this.model.get('format');

        if (format.media_types != undefined) {
            this.ui.format_media_types.selectpicker('val', format.media_types);
        }

        if (format.max_items != undefined) {
            this.ui.format_max_items.val(format.max_items);
        } else {
            this.ui.format_max_items.val(2);
        }

        if (format.media_inline != undefined) {
            this.ui.format_media_inline.selectpicker('val', format.media_inline ? "true" : "false");
        } else {
            this.ui.format_media_inline.selectpicker('val', "false");
        }
    },

    getFormat: function() {
        return {
            'media_types': this.ui.format_media_types.val(),
            'max_items': parseInt(this.ui.format_max_items.val()),
            'media_inline': this.ui.format_media_inline.val() === "true"
        }
    }
});

module.exports = MediaCollection;

