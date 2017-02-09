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
    create: function(format, parent, readOnly, entityModel) {
        readOnly || (readOnly = false);

        this.value = null;

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

                preview.attr('media-target', "").addClass('disabled');
                download.attr('media-target', "").addClass('disabled');

                preview.on('click', $.proxy(function(e) {
                    var value = this.value;

                    if (value) {
                        $.ajax({
                            url: application.baseUrl + 'medialibrary/media/' + value + '/'
                        }).success(function (data) {
                            // get mime-type, and if compatible with a client view show it else download it
                            if (data.mime_type.startsWith('image/')) {
                                window.open(application.baseUrl + 'medialibrary/media/' + value + '/download/', "_blank")
                            } else {
                                // download the document
                                $('<form></form>')
                                    .attr('action', application.baseUrl + 'medialibrary/media/' + value + '/download/')
                                    .appendTo('body').submit().remove();
                            }
                        });
                    }
                }, this));

                download.on('click', $.proxy(function(e) {
                    if (this.value) {
                        // download the document
                        $('<form></form>')
                            .attr('action', application.baseUrl + 'medialibrary/media/' + this.value + '/download/')
                            .appendTo('body').submit().remove();
                    }
                }, this));

                this.preview = preview;
                this.download = download;

                this.parent = parent;
                this.readOnly = true;
                this.el = btnGroup;
            }
        } else {
            /* show upload button and progress bar */
            var group = $('<div class="input-group"></div>');

            var btnGroup = $('<span class="input-group-btn"></span>');
            var browse = $('<span class="btn btn-default btn-file">' + gt.gettext('Browse') + '</span>');
            var erase = $('<span class="btn btn-default btn-file"><span class="glyphicon glyphicon-remove"></span></span>');

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

            browse.append(input);
            btnGroup.append(browse);
            btnGroup.append(erase);

            group.append(btnGroup);
            group.append(fileName);
            group.append(progress);
            group.append(glyph);

            parent.append(group);

            // erase if not currently uploading and already exists
            erase.on('click', $.proxy(function(e) {
                if (this.value != null) {
                    // erase the media and set descriptor value to none
                    $.ajax({
                        type: "DELETE",
                        url: application.baseUrl + '/medialibrary/media/' + this.value + '/',
                        contentType: "application/json; charset=utf-8"
                    }).done(function(data) {
                        this.value = null;
                    }).fail(function() {
                        $.alert.error(gt.gettext("Unable to remove the media"));
                    });
                }
            }, this));

            // upload on change
            input.on('change', $.proxy(function(e) {
                $.ajax({
                    type: "POST",
                    url: application.baseUrl + '/medialibrary/media/upload/',
                    contentType: "application/json; charset=utf-8"
                }).done(function(data) {
                    this.value = data.uuid;
                }).fail(function() {
                    this.value = null;
                    $.alert.error(gt.gettext("Error during file upload"));
                });
            }, this));

            this.browse = browse;
            this.erase = erase;

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
            if (this.readOnly) {
                if (this.value != null && this.preview.hasClass('disabled')) {
                    this.preview.removeClass('disabled');
                }

                if (this.value != null && this.download.hasClass('disabled')) {
                    this.download.removeClass('disabled');
                }
            } else {
                if (this.browse.hasClass('disabled')) {
                    this.browse.removeClass('disabled');
                }

                if (this.erase.hasClass('disabled')) {
                    this.erase.removeClass('disabled');
                }
            }
        }
    },

    disable: function() {
        if (this.el) {
            if (this.readOnly) {
                if (!this.preview.hasClass('disabled')) {
                    this.preview.addClass('disabled');
                }

                if (!this.download.hasClass('disabled')) {
                    this.download.addClass('disabled');
                }
            } else {
                if (!this.browse.hasClass('disabled')) {
                    this.browse.addClass('disabled');
                }

                if (!this.erase.hasClass('disabled')) {
                    this.erase.addClass('disabled');
                }
            }
        }
    },

    set: function (format, definesValues, defaultValues) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.value = defaultValues[0];

                if (this.preview.hasClass('disabled')) {
                    this.preview.removeClass('disabled');
                }

                if (this.download.hasClass('disabled')) {
                    this.download.removeClass('disabled');
                }
            } else {
                this.value = null;

                if (!this.preview.hasClass('disabled')) {
                    this.preview.addClass('disabled');
                }

                if (!this.download.hasClass('disabled')) {
                    this.download.addClass('disabled');
                }
            }
        } else {
            if (definesValues) {
                this.value = defaultValues[0];

                if (this.erase.hasClass('disabled')) {
                    this.erase.removeClass('disabled');
                }
            } else {
                this.value = null;

                if (!this.erase.hasClass('disabled')) {
                    this.erase.addClass('disabled');
                }
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                return [this.value];
            } else {
                return [this.value];
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