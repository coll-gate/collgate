/**
 * @file media.js
 * @brief Display and manage a media format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-25
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
let Marionette = require('backbone.marionette');

let Media = function() {
    DescriptorFormatType.call(this);

    this.name = "media";
    this.group = "media";
};

_.extend(Media.prototype, DescriptorFormatType.prototype, {
    create: function(format, parent, options) {
        options || (options = {
            readOnly: false,
            history: false
        });

        this.value = null;

        if (options.readOnly) {
            let group = $('<div class="input-group"></div>');
            let glyph = $('<span class="input-group-addon"><span class="fa fa-file"></span></span>');
            glyph.css(this.spanStyle);

            if (options.history) {
                // @todo
            }

            if (format.media_inline) {
                /* miniature + download */
                let group = $('<div class="input-group"></div>');
                let collection = $('<div class="media-image-collection"></div>');
                let glyph = $('<span class="input-group-addon"><span class="fa fa-file"></span></span>');

                collection.css('height', 'auto');

                group.append(collection);
                group.append(glyph);

                parent.append(group);

                this.image = null;
                this.collection = collection;
                this.el = group;
                this.parent = parent;
            } else {
                let btnGroup = $('<span class="input-group-btn"></span>');
                btnGroup.css({
                    'width': '100%',
                    'height': '24px',
                    'padding': '0px'
                });

                let preview = $('<span class="media-preview btn btn-default"><span class="fa fa-eye"></span>&nbsp;' + _t('Preview') + '</span>');
                preview.css({
                    'padding-top': '1px',
                    'padding-bottom': '1px',
                    'height': '24px',
                    'width': 'calc(50% + 1px)'
                });
                btnGroup.append(preview);

                let download = $('<span class="media-download btn btn-default"><span class="fa fa-download"></span>&nbsp;' + _t('Download') + '</span>');
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
                    if (this.value) {
                        let widget = this;

                        // get the media mime-type
                        $.ajax({
                            type: "GET",
                            url: window.application.url(['medialibrary', 'media', this.value]),
                            contentType: "application/json; charset=utf-8"
                        }).done(function(data) {
                            let url = window.application.url(['medialibrary', 'media', data.uuid, 'download']);

                            // get mime-type, and if compatible with a client view show it else download it
                            if (data.mime_type.startsWith('image/')) {
                                let img = $('<img src="' + url + '" alt="' + data.file_name + '"></img>');
                                img.css('display', 'none');

                                $('body').append(img);

                                img.viewer({
                                    transition: false
                                }).viewer('show');

                                img.on('hidden.viewer', $.proxy(function(e) {
                                    img.viewer('destroy').remove();
                                }, this));
                            } else {
                                // download the document
                                $('<form></form>')
                                    .attr('action', window.application.url(['medialibrary', 'media', data.uuid, 'download']))
                                    .appendTo('body').submit().remove();
                            }
                        });
                    }
                }, this));

                download.on('click', $.proxy(function(e) {
                    if (this.value) {
                        // download the document
                        $('<form></form>')
                            .attr('action', window.application.url(['medialibrary', 'media', this.value, 'download']))
                            .appendTo('body').submit().remove();
                    }
                }, this));

                this.preview = preview;
                this.download = download;

                this.parent = parent;
                this.el = btnGroup;
            }

            this.readOnly = true;
        } else {
            /* show upload button and progress bar */
            let group = $('<div class="input-group"></div>');

            let btnGroup = $('<span class="input-group-btn"></span>');
            let browse = $('<span class="btn btn-default btn-file">' + _t('Browse') + '</span>');
            let erase = $('<span class="btn btn-default btn-file"><span class="fa fa-times"></span></span>');

            let input = $('<input type="file" style="display: none;">');
            let progress = $('<span class="input-group-addon progress"><span class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em;">0%</span></span>');
            let fileName = $('<input type="text" class="form-control" readonly>');
            let glyph = $('<span class="input-group-addon"><span class="fa fa-file"></span></span>');

            if (options.history) {
                // @todo
            }

            progress.css({
                'width': '30%',
                'padding': '0px',
                //'border-top': '0px',
                //'border-bottom': '0px',
                'border-left': '0px'
            });

            btnGroup.append(browse);
            btnGroup.append(erase);

            group.append(btnGroup);
            group.append(input);
            group.append(fileName);
            group.append(progress);
            group.append(glyph);

            parent.append(group);

            // browse button open the hidden input[type=file]
            browse.on('click', $.proxy(function(e) {
                this.el.click();
                return false;
            }, this));

            // upload a file object.
            let uploadFile = function(widget, file) {
                // empty progress bar
                widget.progress.updateProgressBar(0, 0, 0);

                let formData = new FormData();
                formData.append('file', file);

                $.ajax({
                    type: "POST",
                    url: window.application.url(['medialibrary', 'media', 'upload']),
                    encType: "multipart/form-data",
                    data: formData,
                    cache: false,
                    contentType: false,
                    processData: false,
                    xhr: function() {
                        let xhr = $.ajaxSettings.xhr();

                        // progression
                        xhr.onprogress = function(e) {
                            widget.progress.updateProgressBar(0, e.total, e.loaded);
                        };

                        // progression
                        xhr.upload.onprogress = function(e) {
                            widget.progress.updateProgressBar(0, e.total, e.loaded);
                        };

                        return xhr;
                    },
                    beforeSend: function() {
                        // cancel upload button
                        // cancelButton.click(xhr.abort); @todo
                    }
                }).done(function(data) {
                    widget.value = data.uuid;
                    widget.media = data;

                    if (widget.erase.hasClass('disabled')) {
                        widget.erase.removeClass('disabled');
                    }
                }).fail(function() {
                    widget.value = null;
                    $.alert.error(_t("Error during file upload"));
                });
            };

            // upload on change
            input.on('change', $.proxy(function(e) {
                let file = this.el[0].files[0];
                this.fileName.val(file.name);

                uploadFile(this, this.el[0].files[0]);
            }, this));

            // manage the drop on the input
            fileName.on('drop', $.proxy(function(e) {
                if (e.originalEvent.stopPropagation) {
                   e.originalEvent.stopPropagation();
                }

                this.fileName.prop('readonly', true);

                // jquery returns event in originalEvent
                let file = e.originalEvent.dataTransfer.files[0];
                this.fileName.attr('value', file.name);

                uploadFile(this, file);

                return false;
            }, this));

            fileName.on('dragenter', $.proxy(function(e) {
                if (e.originalEvent.stopPropagation) {
                   e.originalEvent.stopPropagation();
                }

                this.fileName.prop('readonly', false);

                return false;
            }, this));

            fileName.on('dragleave', $.proxy(function(e) {
                if (e.originalEvent.stopPropagation) {
                   e.originalEvent.stopPropagation();
                }

                this.fileName.prop('readonly', true);

                return false;
            }, this));

            // erase if not currently uploading and already exists
            erase.on('click', $.proxy(function(e) {
                if (this.initial === this.value) {
                    // just clear the descriptor value, the media will be deleted at describable save
                    this.fileName.val("");
                    this.value = null;
                } else if (this.value != null) {
                    let widget = this;

                    // erase the last uploaded media and set descriptor value to null
                    $.ajax({
                        type: "DELETE",
                        url: window.application.url(['medialibrary', 'media', this.value]),
                        contentType: "application/json; charset=utf-8"
                    }).done(function(data) {
                        widget.fileName.val("");
                        widget.value = null;
                    }).fail(function() {
                        $.alert.error(_t("Unable to remove the media"));
                    });
                }

                this.progress.updateProgressBar(0, 0, 0);
            }, this));


            this.fileName = fileName;
            this.progress = progress;
            this.browse = browse;
            this.erase = erase;
            this.initial = null;

            this.parent = parent;
            this.el = input;
        }
    },

    destroy: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                if (this.image) {
                    this.image.viewer('destroy');
                    this.el.remove();
                } else {
                    this.el.parent().remove();
                }
            } else {
                this.el.parent().remove();
            }
        }
    },

    cancel: function() {
        if (this.el && this.parent) {
            if (!this.readOnly && this.value && this.value != this.initial) {
                let widget = this;

                // erase the last uploaded media and set descriptor value to null
                $.ajax({
                    type: "DELETE",
                    url: window.application.url(['medialibrary', 'media', this.value]),
                    contentType: "application/json; charset=utf-8"
                }).done(function(data) {
                    widget.fileName.val("");
                    widget.value = null;
                });

                this.progress.updateProgressBar(0, 0, 0);
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

    set: function (format, definesValues, defaultValues, options) {
        if (!this.el || !this.parent) {
            return;
        }

        definesValues = this.isValueDefined(definesValues, defaultValues);

        if (this.readOnly) {
            if (definesValues) {
                this.value = defaultValues;

                // mean inline mode for image
                if (this.collection) {
                     let widget = this;

                    // get the media file name
                    $.ajax({
                        type: "GET",
                        url: window.application.url(['medialibrary', 'media', this.value]),
                        contentType: "application/json; charset=utf-8"
                    }).done(function(data) {
                        widget.media = data;

                        let url = window.application.url(['medialibrary', 'media', data.uuid, 'download']);
                        let img = $('<img class="media-image" src="' + url + '" alt="' + data.file_name + '"></img>');

                        // center the miniature
                        img.css({
                            'height': '100px',
                            'margin-left': '43.5%'
                        });

                        let download = $('<span class="media-download contextual btn btn-default"><span class="fa fa-download"></span></span>');
                        download.on('click', $.proxy(function(e) {
                            // download the document
                            $('<form></form>')
                                .attr('action', window.application.url(['medialibrary', 'media', this.value, 'download']))
                                .appendTo('body').submit().remove();
                        }, widget));

                        widget.collection.append(img);
                        widget.collection.append(download);

                        img.viewer({
                            transition: false
                        });

                        widget.image = img;
                    });
                } else {
                    if (this.preview.hasClass('disabled')) {
                        this.preview.removeClass('disabled');
                    }

                    if (this.download.hasClass('disabled')) {
                        this.download.removeClass('disabled');
                    }
                }
            } else {
                this.value = null;

                if (this.collection) {
                    let placeholder = $('<span class="fa fa-ban"></span>');

                    // center the placeholder
                    placeholder.css({
                        'margin-left': '43.5%',
                        'padding': '3px'
                    });

                    this.collection.append(placeholder);
                } else {
                    if (!this.preview.hasClass('disabled')) {
                        this.preview.addClass('disabled');
                    }

                    if (!this.download.hasClass('disabled')) {
                        this.download.addClass('disabled');
                       }
                }
            }
        } else {
            if (definesValues) {
                this.initial = this.value = defaultValues;

                if (this.erase.hasClass('disabled')) {
                    this.erase.removeClass('disabled');
                }

                let widget = this;

                // get the media file name
                $.ajax({
                    type: "GET",
                    url: window.application.url(['medialibrary', 'media', this.value]),
                    contentType: "application/json; charset=utf-8"
                }).done(function(data) {
                    widget.fileName.val(data.file_name);
                    widget.media = data;
                });
            } else {
                this.initial = this.value = null;

                if (!this.erase.hasClass('disabled')) {
                    this.erase.addClass('disabled');
                }
            }
        }
    },

    values: function() {
        if (this.el && this.parent) {
            if (this.readOnly) {
                return this.value;
            } else {
                return this.value;
            }
        }

        return [null];
    },

    checkCondition: function(condition, values) {
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
                /* @todo */
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
    }
});

Media.DescriptorTypeDetailsView = Marionette.View.extend({
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

        let format = this.model.get('format');

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
