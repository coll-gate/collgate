/**
 * @file batch.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-06-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let BatchModel = require('../models/batch');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');
let Search = require('../../main/utils/search');

let BatchLayout = require('../views/batchlayout');
let SearchEntityDialog = require('../views/search');

let Controller = Marionette.Object.extend({
    create: function () {
        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'meta-model', 'for-describable', 'accession.batch']),
            dataType: 'json'
        }).done(function (data) {
            let CreateBatchView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_batch'
                },
                template: require('../templates/navbatchcreate.html'),
                templateContext: function () {
                    return {
                        meta_models: data
                    };
                },

                ui: {
                    validate: "button.continue",
                    name: "#batch_name",
                    meta_model: "#meta_model",
                    accession: "#accession"
                },

                events: {
                    'click @ui.validate': 'onContinue',
                    'input @ui.name': 'onNameInput',
                    'change @ui.accession': 'validateAccession'
                },

                onRender: function () {
                    CreateBatchView.__super__.onRender.apply(this);

                    application.main.views.languages.drawSelect(this.ui.language);
                    this.ui.meta_model.selectpicker({});

                    this.ui.accession.select2(Search(
                        this.ui.accession.parent(),
                        window.application.url(['accession', 'accession', 'search']),
                        function (params) {
                            return {
                                method: 'icontains',
                                fields: ['name'],
                                'name': params.term.trim()
                            };
                        }, {
                            placeholder: _t("Enter a accession name. 3 characters at least for auto-completion")
                        })
                    );
                },

                onBeforeDestroy: function () {
                    this.ui.meta_model.selectpicker('destroy');
                    this.ui.accession.select2('destroy');

                    CreateBatchView.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    let name = this.ui.name.val().trim();

                    if (this.validateName()) {
                        let filters = {
                            method: 'ieq',
                            fields: ['name'],
                            'name': name
                        };

                        $.ajax({
                            type: "GET",
                            url: window.application.url(['accession', 'batch', 'search']),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name
                        }).done(function (data) {
                            for (let i in data.items) {
                                let t = data.items[i];
                                if (t.label.toUpperCase() === name.toUpperCase()) {
                                    $(this.el).validateField('failed', _t('Batch name already exist'));
                                    return;
                                }
                            }

                            $(this.el).validateField('ok');
                        });
                    }
                },

                validateName: function () {
                    let v = this.ui.name.val().trim();

                    if (v.length > 128) {
                        $(this.ui.name).validateField('failed', _t('characters_max', {count: 128}));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
                        return false;
                    }
                    return true;
                },

                validateAccession: function () {
                    let accessionId = 0;

                    if (this.ui.accession.val())
                        accessionId = parseInt(this.ui.accession.val());

                    if (accessionId === 0 || isNaN(accessionId)) {
                        $(this.ui.accession).validateField('failed', _t('The accession must be defined'));
                        return false;
                    } else {
                        $(this.ui.accession).validateField('ok');
                        return true;
                    }
                },

                validate: function () {
                    let valid_name = this.validateName();
                    let valid_accession = this.validateAccession();
                    return (valid_name && valid_accession);
                },

                onContinue: function () {
                    let view = this;

                    if (this.validate()) {
                        let name = this.ui.name.val().trim();
                        let accession = parseInt(this.ui.accession.val());
                        let metaModel = parseInt(this.ui.meta_model.val());

                        // create a new local model and open an edit view with this model
                        let model = new BatchModel({
                            name: name,
                            accession: accession,
                            descriptor_meta_model: metaModel
                        });

                        view.destroy();

                        let defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Batch"),
                            model: model
                        }));

                        let batchLayout = new BatchLayout({model: model});
                        defaultLayout.showChildView('content', batchLayout);
                    }
                }
            });

            let createBatchView = new CreateBatchView();
            createBatchView.render();
        });
    },

    search: function () {
        let searchEntityDialog = new SearchEntityDialog();
        searchEntityDialog.render();
    }
});

module.exports = Controller;
