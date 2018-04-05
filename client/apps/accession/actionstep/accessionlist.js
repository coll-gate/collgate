/**
 * @file accessionlist.js
 * @brief Simple accession list action step
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormat = require('./actionstepformat');
let Marionette = require('backbone.marionette');

let AccessionList = function() {
    ActionStepFormat.call(this);

    this.name = "accession_list";
    this.group = "standard";
    this.description = _t("Take a list of accession in input and dispose this same list as output for the next step.");
};

_.extend(AccessionList.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
        return {};
    }
});

AccessionList.ActionStepProcessView = ActionStepFormat.ActionStepProcessView.extend({
    className: 'action-step-process',
    template: require('../templates/actionstep/accessionlistprocess.html'),

    ui: {
        list_type: "select[name=accession-list-type]",
        panel_group: "div[name=panel]",
        upload_group: "div[name=upload]",
        manual_group: "div[name=manual]",
        accession_upload: 'input[name=accession-upload]',
        panel: "select[name=accession-panel]",
        manual: "select[name=accession-list]"
    },

    events: {
        'change @ui.list_type': 'onChangeListType',
        'change @ui.accession_upload': 'onAccessionUpload'
    },

    initialize: function(options) {
        options || (options = {readonly: true});

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function () {
        this.ui.list_type.selectpicker({});

        this.ui.panel.select2({
            dropdownParent: this.$el,
            ajax: {
                url: window.application.url(['accession', 'accessionpanel', 'search']),
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    params.term || (params.term = '');

                    return {
                        filters: JSON.stringify({
                            method: 'icontains',
                            fields: ['name'],
                            name: params.term
                        }),
                        cursor: params.next
                    };
                },
                processResults: function (data, params) {
                    params.next = null;

                    if (data.items.length >= 30) {
                        params.next = data.next || null;
                    }

                    let results = [];

                    for (let i = 0; i < data.items.length; ++i) {
                        results.push({
                            id: data.items[i].id,
                            text: data.items[i].label
                        });
                    }

                    return {
                        results: results,
                        pagination: {
                            more: params.next != null
                        }
                    };
                },
                cache: true
            },
            minimumInputLength: 3,
            placeholder: _t("Select a panel")
        });

        this.ui.manual.select2({
            multiple: true,
            dropdownParent: this.$el,
            ajax: {
                url: window.application.url(['accession', 'accession', 'search']),
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    params.term || (params.term = '');

                    return {
                        filters: JSON.stringify({
                            method: 'icontains',
                            fields: ['name', 'code'],
                            name: params.term
                        }),
                        cursor: params.next
                    };
                },
                processResults: function (data, params) {
                    params.next = null;

                    if (data.items.length >= 30) {
                        params.next = data.next || null;
                    }

                    let results = [];

                    for (let i = 0; i < data.items.length; ++i) {
                        results.push({
                            id: data.items[i].id,
                            text: data.items[i].label
                        });
                    }

                    return {
                        results: results,
                        pagination: {
                            more: params.next != null
                        }
                    };
                },
                cache: true
            },
            width: "100%",
            allowClear: true,
            minimumInputLength: 1,
            placeholder: _t("Enter a value.")
        }).fixSelect2Position();
    },

    onBeforeDestroy: function() {
        this.ui.list_type.selectpicker('destroy');
        this.ui.manual.select2('destroy');
        this.ui.panel.select2('destroy');
    },

    inputsType: function() {
        return this.ui.list_type.val();
    },

    inputsData: function() {
        let v = this.ui.list_type.val();

        if (v === "panel") {
            return parseInt(this.ui.panel.val());
        } else if (v === "upload") {
            return "upload";
        } else if (v === "list") {
            let ids = this.ui.manual.val();

            return _.map(ids, function (id) {
                return parseInt(id);
            });
        }

        return null;
    },

    onChangeListType: function() {
        let v = this.ui.list_type.val();

        if (v === "panel") {
            this.ui.panel_group.css('display', 'block');
            this.ui.upload_group.css('display', 'none');
            this.ui.manual_group.css('display', 'none');
        } else if (v === "upload") {
            this.ui.panel_group.css('display', 'none');
            this.ui.upload_group.css('display', 'block');
            this.ui.manual_group.css('display', 'none');
        } else if (v === "list") {
            this.ui.panel_group.css('display', 'none');
            this.ui.upload_group.css('display', 'none');
            this.ui.manual_group.css('display', 'block');
        }
    },

    onAccessionUpload: function () {
        let file = this.ui.accession_upload[0].files[0];
        this.uploadFile(file, 'data');
    },

    uploadFile: function (file, target) {
        let self = this;

        let formData = new FormData();
        formData.append('file', file);
        formData.append('target', target);

        $.ajax({
            type: "POST",
            url: window.application.url(['accession', 'action', this.model.get('id'), 'upload']),
            encType: "multipart/form-data",
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            xhr: function () {
                let xhr = $.ajaxSettings.xhr();

                // progression
                xhr.onprogress = function (e) {
                    self.ui.accession_upload.prop('disabled', true);
                };

                // progression
                xhr.upload.onprogress = function (e) {
                    self.ui.accession_upload.prop('disabled', true);
                };

                return xhr;
            },
            beforeSend: function () {
                // cancel upload button
                // cancelButton.click(xhr.abort); @todo
            }
        }).done(function (data) {
            self.ui.accession_upload.prop('disabled', false);

            // update model data
            self.model.set('data', data.data);

            $.alert.success(_t("Successfully uploaded !"));
        }).fail(function () {
            $.alert.error(_t("Error during file upload"));
            self.ui.accession_upload.prop('disabled', false);
        });
    }
});

AccessionList.ActionStepReadView = ActionStepFormat.ActionStepReadView.extend({
});

AccessionList.ActionStepFormatDetailsView = ActionStepFormat.ActionStepFormatDetailsView.extend({
    className: 'action-step-format-details',
    template: require('../templates/actionstep/accessionlist.html'),

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        let format = this.model.get('format');
    },

    storeData: function() {
        return {
        }
    }
});

module.exports = AccessionList;
