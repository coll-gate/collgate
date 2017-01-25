/**
 * @file mediacollection.js
 * @brief Display and manage a collection of medias format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-25
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
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
    create: function(format, parent, readOnly, create) {
        readOnly || (readOnly = false);
        create || (create = true);

        this.owned = create;

        if (readOnly) {
            var input = null;

            /* @todo */
            if (create) {
                input = this._createStdInput(parent, "glyphicon-check");
            } else {
                input = parent.children('input');
            }

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
        if (this.el && this.parent && this.owned) {
            if (this.readOnly) {
                this.el.parent().remove();
            } else {
                /*this.el.remove(); @todo */
            }
        }
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

    set: function (format, definesValues, defaultValues, descriptorTypeGroup, descriptorTypeId) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                /* @todo */
            }
        } else {
            if (definesValues) {
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

        return [null];
    },

    checkCondition: function(condition, values) {
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
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        this.ui.format_media_types.selectpicker({
            style: 'btn-default',
            container: 'body'
        });

        var format = this.model.get('format');

        if (format.media_types != undefined) {
            this.ui.format_media_types.selectpicker('val', format.media_types);
        }

        if (format.max_items != undefined) {
            this.ui.format_max_items.val(format.max_items);
        } else {
            this.ui.format_max_items.val(2);
        }
    },

    getFormat: function() {
        return {
            'media_types': this.ui.format_media_types.val(),
            'max_items': this.ui.format_max_items.val()
        }
    }
});

module.exports = MediaCollection;