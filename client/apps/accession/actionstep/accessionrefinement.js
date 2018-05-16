/**
 * @file accessionrefinement.js
 * @brief Accession refinement
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-19
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormat = require('./actionstepformat');
let Marionette = require('backbone.marionette');

let ScrollingMoreView = require('../../main/views/scrollingmore');
let ContentBottomFooterLayout = require('../../main/views/contentbottomfooterlayout');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');

let Format = function() {
    ActionStepFormat.call(this);

    this.name = "accession_refinement";
    this.group = "standard";
    this.description = _t("Take a list of accession in input and generate a filtered list of accession based on the input.");

    this.type = this.ACTION_TYPE_USER;
    this.acceptFormat = ['accession_id'];
    this.dataFormat = ['accession_id'];
};

_.extend(Format.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
        return {};
    }
});

// @todo user action processing (using a file upload or using the panel of accession with a validation)
Format.ActionStepProcessView = ActionStepFormat.ActionStepProcessView.extend({
    className: 'action-step-process',
    template: require('../templates/actionstep/process/accessionrefinement.html'),

    ui: {
        accession_list: 'select[name=get-accession-list]',
        upload_group: 'div[name=upload]',
        panel_group: 'div[name=panel-group]',
        accession_upload: 'input[name=accession-upload]',
        accession_upload_group: 'div[name=upload]',
        accession_uploaded_group: 'div[name=uploaded]'
    },

    events: {
        'change @ui.accession_list': 'onGetAccessionList',
        'change @ui.accession_upload': 'onAccessionUpload'
    },

    initialize: function (options) {
        options || (options = {readonly: true});

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function () {
        this.ui.panel_group.css('display', 'none');
        this.ui.accession_list.selectpicker({});

        // get accession list from the previous step
        if (this.getOption("stepIndex") < 1) {
            this.ui.accession_list.prop('disabled', true);
        }

        if (this.stepData().state >= 1) {
            this.ui.accession_upload_group.css('display', 'none');
            this.ui.accession_uploaded_group.css('display', 'block');
        }
    },

    onBeforeDestroy: function () {
        this.ui.accession_list.selectpicker('destroy');
    },

    inputsType: function () {
        return 'none';
    },

    inputsData: function () {
        return null;
    },

    inputsColumns: function() {
        return ['accession_id'];
    },

    onGetAccessionList: function () {
        let type = this.ui.accession_list.val();

        if (this.getOption("stepIndex") < 1) {
            return;
        }

        if (type === 'original-csv') {
            this.downloadData('csv', this.getOption("stepIndex")-1);
        } else if (type === 'original-xlsx') {
            this.downloadData('xlsx', this.getOption("stepIndex")-1);
        } else if (type === 'original-panel') {
            // @todo a dialog to name the panel
            alert("todo");
        }

        this.ui.accession_list.val("").selectpicker('refresh');
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
    },

    showWorkingPanel: function(region) {
        let self = this;
        let panelId = 1; // @todo

        let AccessionCollection = require('../collections/accession');
        let accessionPanelAccessions = new AccessionCollection([], {panel_id: panelId});

        let columns = window.application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.accession'}
        });

        columns.done(function (data) {
            let AccessionListView = require('../actionstep/accessionrefinementlist');
            let accessionListView = new AccessionListView({
                collection: accessionPanelAccessions,
                model: this.model,
                columns: data[0].value,
                collectionEvents: {
                    // 'update': 'updateAmount'
                },
                /// layoutView: region,
                relatedEntity: {
                    'content_type': 'accession.accessionpanel',
                    'id': self.model.get('id')
                }
            });

            let contentBottomFooterLayout = new ContentBottomFooterLayout();
            region.show(contentBottomFooterLayout);

            contentBottomFooterLayout.showChildView('content', accessionListView);
            contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                collection: accessionPanelAccessions,
                targetView: accessionListView
            }));

            contentBottomFooterLayout.showChildView('footer', new EntityListFilterView({
                collection: accessionPanelAccessions,
                columns: data[0].value
            }));

            accessionListView.query();
        });
    },

    showDonePanel: function(region) {

    }
});

Format.ActionStepReadView = ActionStepFormat.ActionStepReadView.extend({
});

Format.ActionStepFormatDetailsView = ActionStepFormat.ActionStepFormatDetailsView.extend({
    className: 'action-step-format-details',
    template: require('../templates/actionstep/type/accessionrefinement.html'),

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

module.exports = Format;
