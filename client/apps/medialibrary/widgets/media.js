/**
 * @file media.js
 * @brief Display and manage a media format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-25
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
var Marionette = require('backbone.marionette');

var Media = function() {
    DescriptorFormatType.call(this);

    this.name = "media";
    this.group = "media";
};

_.extend(Media.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, readOnly) {
        readOnly || (readOnly = false);

        if (readOnly) {
            var group = $('<div class="input-group"></div>');
            var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-file"></span></span>');
            glyph.css(this.spanStyle);

            if (format.media_inline) {
                /* todo show miniature inline + download button */
            } else {
                var btnGroup = $('<span class="input-group-btn"></span>');
                btnGroup.css({
                    'width': '100%',
                    'height': '24px',
                    'padding': '0px'
                });

                var preview = $('<span class="media-preview btn btn-default"><span class="glyphicon glyphicon-eye-open"></span>&nbsp;' + gt.gettext('Preview') + '</span>');
                preview.css({
                    'padding-top': '1px',
                    'padding-bottom': '1px',
                    'height': '24px',
                    'width': 'calc(50% + 1px)'
                });
                btnGroup.append(preview);

                var download = $('<span class="media-download btn btn-default"><span class="glyphicon glyphicon-download"></span>&nbsp;' + gt.gettext('Download') + '</span>');
                download.css({
                    'padding-top': '1px',
                    'padding-bottom': '1px',
                    'height': '24px',
                    'width': 'calc(50% + 1px)'
                });
                btnGroup.append(download);

                group.append(btnGroup);
                group.append(glyph);

                parent.append(group);

                this.parent = parent;
                this.readOnly = true;
                this.el = btnGroup;
            }
        } else {
            /* show upload button and progress bar */
            var group = $('<div class="input-group"></div>');

            var btnGroup = $('<span class="input-group-btn"></span>');

            var button = $('<span class="btn btn-default btn-file">' + gt.gettext('Browse') + '</span>');
            var input = $('<input type="file">');
            var progress = $('<span class="input-group-addon progress"><span class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em;">0%</span></span>');
            var fileName = $('<input type="text" class="form-control" readonly>');
            var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-file"></span></span>');

            input.on("change", function() {
                var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
                fileName.val(label);
            });

            fileName.css({
            });

            progress.css({
                'width': '30%',
                'padding': '0px',
                //'border-top': '0px',
                //'border-bottom': '0px',
                'border-left': '0px'
            });

            button.append(input);
            btnGroup.append(button);

            group.append(btnGroup);
            group.append(fileName);
            group.append(progress);
            group.append(glyph);

            parent.append(group);

            this.parent = parent;
            this.el = input;
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

Media.DescriptorTypeDetailsView = Marionette.ItemView.extend({
    className: 'descriptor-type-details-format',
    template: require('../templates/widgets/media.html'),

    ui: {
        format_media_types: '#format_media_types',
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

        if (format.media_inline != undefined) {
            this.ui.format_media_inline.selectpicker('val', format.media_inline ? "true" : "false");
        } else {
            this.ui.format_media_inline.selectpicker('val', "false");
        }
    },

    getFormat: function() {
        return {
            'media_types': this.ui.format_media_types.val(),
            'media_inline': this.ui.format_media_inline.val() === "true"
        }
    }
});

module.exports = Media;