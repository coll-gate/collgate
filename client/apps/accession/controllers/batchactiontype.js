/**
 * @file batchactiontype.js
 * @brief Batch action type controller
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-19
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let BatchActionTypeModel = require('../models/batchactiontype');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');

let BatchActionTypeLayout = require('../views/batchactiontype/batchactiontypelayout');

let Controller = Marionette.Object.extend({

    create: function() {
        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'meta-model', 'for-describable', 'accession.batchactiontype']),
            dataType: 'json'
        }).done(function(data) {
            let CreateBatchActionTypeDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_batchactiontype'
                },
                template: require('../templates/batchactiontype/batchactiontypecreate.html'),

                ui: {
                    validate: "button.continue",
                    name: "input[name=name]",
                    format_type: "select[name=format]"
                },

                events: {
                    'click @ui.validate': 'onContinue',
                    'input @ui.name': 'onNameInput'
                },

                initialize: function (options) {
                    CreateBatchActionTypeDialog.__super__.initialize.apply(this);
                },

                onRender: function () {
                    CreateBatchActionTypeDialog.__super__.onRender.apply(this);

                    application.accession.views.batchActionTypeFormats.drawSelect(this.ui.format_type, true, false, 'creation');
                },

                onBeforeDestroy: function() {
                    this.ui.format_type.selectpicker('destroy');

                    CreateBatchActionTypeDialog.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    let name = this.ui.name.val().trim();
                    let self = this;

                    if (this.validateName()) {
                        let filters = {
                            method: 'ieq',
                            fields: ['name'],
                            'name': name
                        };

                        $.ajax({
                            type: "GET",
                            url: window.application.url(['accession', 'batchactiontype', 'search']),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                        }).done(function (data) {
                            for (let i in data.items) {
                                let t = data.items[i];

                                if (t.value.toUpperCase() === name.toUpperCase()) {
                                    self.ui.name.validateField('failed', _t('Name already used'));
                                    return;
                                }
                            }

                            self.ui.name.validateField('ok');
                        });
                    }
                },

                validateName: function() {
                    let v = this.ui.name.val().trim();

                    if (v.length > 128) {
                        this.ui.name.validateField('failed', _t('characters_max', {count: 128}));
                        return false;
                    } else if (v.length < 1) {
                        this.ui.name.validateField('failed', _t('characters_min', {count: 1}));
                        return false;
                    }

                    return true;
                },

                validate: function() {
                    let valid = this.validateName();
                    let formatType = this.ui.format_type.val();

                    if (formatType === "") {
                        $.alert.error(_t("The format must be defined"));
                        valid = false;
                    }

                     if (this.ui.name.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onContinue: function() {
                    let view = this;

                    if (this.validate()) {
                        let name = this.ui.name.val().trim();
                        let formatType = this.ui.format_type.val();

                        // create a new local model and open an edit view with this model
                        let model = new BatchActionTypeModel({
                            name: name,
                            format: {type: formatType}
                        });

                        view.destroy();

                        let defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Batch action type"),
                            model: model
                        }));

                        let batchActionTypeLayout = new BatchActionTypeLayout({model: model});
                        defaultLayout.showChildView('content', batchActionTypeLayout);
                    }
                }
            });

            let createBatchActionTypeView = new CreateBatchActionTypeDialog();
            createBatchActionTypeView.render();
        });
    }
});

module.exports = Controller;
