/**
 * @file batch.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-06-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var BatchModel = require('../models/batch');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var Dialog = require('../../main/views/dialog');
var BatchLayout = require('../views/batchlayout');
var SearchEntityDialog = require('../views/search');

var Controller = Marionette.Object.extend({

    create: function () {
        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'meta-model', 'for-describable', 'accession.batch']),
            dataType: 'json'
        }).done(function (data) {
            var CreateBatchView = Dialog.extend({
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

                    $(this.ui.accession).select2({
                        dropdownParent: this.ui.accession.parent(),
                        ajax: {
                            url: window.application.url(['accession', 'accession', 'search']),
                            dataType: 'json',
                            delay: 250,
                            data: function (params) {
                                params.term || (params.term = '');

                                return {
                                    filters: JSON.stringify({
                                        method: 'icontains',
                                        fields: ['name'],
                                        'name': params.term.trim()
                                    }),
                                    cursor: params.next
                                };
                            },
                            processResults: function (data, params) {
                                params.next = null;

                                if (data.items.length >= 30) {
                                    params.next = data.next || null;
                                }

                                var results = [];

                                for (var i = 0; i < data.items.length; ++i) {
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
                        placeholder: _t("Enter a accession name. 3 characters at least for auto-completion")
                    });
                },

                onBeforeDestroy: function () {
                    this.ui.meta_model.selectpicker('destroy');
                    this.ui.accession.select2('destroy');

                    CreateBatchView.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    var name = this.ui.name.val().trim();

                    if (this.validateName()) {
                        var filters = {
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
                            el: this.ui.name,
                            success: function (data) {
                                for (var i in data.items) {
                                    var t = data.items[i];
                                    if (t.label.toUpperCase() === name.toUpperCase()) {
                                        $(this.el).validateField('failed', _t('Batch name already exist'));
                                        return;
                                    }
                                }

                                $(this.el).validateField('ok');
                            }
                        });
                    }
                },

                validateName: function () {
                    var v = this.ui.name.val().trim();

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
                    var accessionId = 0;

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
                    var valid_name = this.validateName();
                    var valid_accession = this.validateAccession();
                    return (valid_name && valid_accession);
                },

                onContinue: function () {
                    var view = this;

                    if (this.validate()) {
                        var name = this.ui.name.val().trim();
                        var accession = parseInt(this.ui.accession.val());
                        var metaModel = parseInt(this.ui.meta_model.val());

                        // create a new local model and open an edit view with this model
                        var model = new BatchModel({
                            name: name,
                            accession: accession,
                            descriptor_meta_model: metaModel
                        });

                        view.destroy();

                        var defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Batch"),
                            model: model
                        }));

                        var batchLayout = new BatchLayout({model: model});
                        defaultLayout.showChildView('content', batchLayout);
                    }
                }
            });

            var createBatchView = new CreateBatchView();
            createBatchView.render();
        });
    },

    search: function () {
        var searchEntityDialog = new SearchEntityDialog();
        searchEntityDialog.render();
    }
});

module.exports = Controller;
