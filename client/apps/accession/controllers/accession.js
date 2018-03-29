/**
 * @file accession.js
 * @brief Accession controller
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let AccessionModel = require('../models/accession');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');
let Search = require('../../main/utils/search');

let AccessionLayout = require('../views/accession/accessionlayout');
let SearchEntityDialog = require('../views/search');

let Controller = Marionette.Object.extend({

    create: function() {
        let description = $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'layout', 'for-describable', 'accession.accession']),
            dataType: 'json'
        });

        description.then(function(data) {
            let CreateAccessionDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_accession'
                },
                template: require('../templates/accessioncreate.html'),
                templateContext: function () {
                    return {
                        layouts: data
                    };
                },

                ui: {
                    validate: "button.continue",
                    name: "#accession_name",
                    language: "#accession_language",
                    layout: "#layout",
                    primary_classification: "#primary_classification",
                    primary_classification_entry: "#primary_classification_entry"
                },

                events: {
                    'click @ui.validate': 'onContinue',
                    'input @ui.name': 'onNameInput',
                    'change @ui.layout': 'onChangeLayout',
                    'change @ui.primary_classification': 'onChangePrimaryClassification'
                },

                regions: {
                    'namingOptions': 'div.naming-options'
                },

                initialize: function (options) {
                    CreateAccessionDialog.__super__.initialize.apply(this);

                    // map descriptor meta models by theirs ids
                    this.layouts = {};

                    for (let i = 0; i < data.length; ++i) {
                        let dmm = data[i];
                        this.layouts[dmm.id] = dmm;
                    }
                },

                onRender: function () {
                    CreateAccessionDialog.__super__.onRender.apply(this);

                    window.application.main.views.languages.drawSelect(this.ui.language);
                    this.ui.layout.selectpicker({});
                    this.ui.primary_classification.selectpicker({});

                    // naming options
                    let self = this;

                    $.ajax({
                        type: "GET",
                        url: window.application.url(['accession', 'naming', 'accession']),
                        dataType: 'json',
                    }).done(function(data) {
                        let NamingOptionsView = require('../views/namingoption');
                        let len = (data.format.match(/{CONST}/g) || []).length;

                        let namingOptions = new Array(len);

                        self.showChildView("namingOptions", new NamingOptionsView({
                            namingFormat: data.format,
                            namingOptions: namingOptions
                        }));
                    });

                    // on default descriptor layout
                    this.onChangeLayout();
                },

                getLayoutClassifications: function () {
                    let layoutId = parseInt(this.ui.layout.val());

                    let value = Object.resolve(layoutId + ".parameters.data.primary_classification", this.layouts);
                    if (value) {
                        return [value];
                    }

                    return [];
                },

                onBeforeDestroy: function() {
                    this.ui.language.selectpicker('destroy');
                    this.ui.layout.selectpicker('destroy');
                    this.ui.primary_classification.selectpicker('destroy');

                    if (this.ui.primary_classification_entry.data('select2')) {
                        $(this.ui.primary_classification_entry).select2('destroy');
                    }

                    CreateAccessionDialog.__super__.onBeforeDestroy.apply(this);
                },

                onChangeLayout: function() {
                    let select = this.ui.primary_classification;

                    select.children().remove();
                    select.selectpicker('destroy');

                    // classifications list according to the related meta model of accession
                    let ClassificationCollection = require('../../classification/collections/classification');
                    let classificationCollection = new ClassificationCollection();

                    let SelectOption = require('../../main/renderers/selectoption');
                    let classifications = new SelectOption({
                        className: "classification",
                        collection: classificationCollection,
                        filters: [{
                            type: 'term',
                            field: 'id',
                            value: this.getLayoutClassifications(),
                            op: 'in'
                        }]
                    });

                    let self = this;

                    classifications.drawSelect(select).done(function () {
                        self.onChangePrimaryClassification();
                    });
                },

                onChangePrimaryClassification: function () {
                    let classificationId = parseInt(this.ui.primary_classification.val());
                    let select = $(this.ui.primary_classification_entry);

                    if (select.data('select2')) {
                        select.select2('destroy');
                        select.children().remove();
                    }

                    if (isNaN(classificationId)) {
                        return;
                    }

                    select.select2(Search(
                        this.ui.primary_classification_entry.parent(),
                        window.application.url(['classification', 'classificationentry', 'search']),
                        function (params) {
                            return {
                                method: 'icontains',
                                classification_method: 'eq',
                                fields: ['name', 'classification'],
                                'name': params.term.trim(),
                                'classification': classificationId
                            };
                        }, {
                            minimumInputLength: 1,
                            placeholder: _t("Enter a classification entry name.")
                        })
                    ).fixSelect2Position();
                },

                // onCodeInput: function () {
                //     let code = this.ui.code.val().trim();
                //
                //     if (this.validateCode()) {
                //         let filters = {
                //             method: 'ieq',
                //             fields: ['code'],
                //             'code': code
                //         };
                //
                //         $.ajax({
                //             type: "GET",
                //             url: window.application.url(['accession', 'accession', 'search']),
                //             dataType: 'json',
                //             contentType: 'application/json; charset=utf8',
                //             data: {filters: JSON.stringify(filters)},
                //             el: this.ui.code,
                //         }).done(function (data) {
                //             for (let i in data.items) {
                //                 let t = data.items[i];
                //
                //                 if (t.value.toUpperCase() === code.toUpperCase()) {
                //                     $(this.el).validateField('failed', _t('Code of accession already used'));
                //                     return;
                //                 }
                //             }
                //
                //             $(this.el).validateField('ok');
                //         });
                //     }
                // },

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
                            url: window.application.url(['accession', 'accession', 'synonym', 'search']),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                        }).done(function (data) {
                            let accessionCodeId = window.application.main.collections.entitySynonymTypes.findWhere(
                                {name: "accession_code"}).get('id');

                            for (let i in data.items) {
                                let t = data.items[i];

                                if (t.synonym_type === accessionCodeId && t.label.toUpperCase() === name.toUpperCase()) {
                                    self.ui.name.validateField('failed', _t('Synonym used as accession code'));
                                    return;
                                }
                            }

                            self.ui.name.validateField('ok');
                        });
                    }
                },

                // validateCode: function() {
                //     let v = this.ui.code.val().trim();
                //
                //     if (v.length > 128) {
                //         this.ui.code.validateField('failed', _t('characters_max', {count: 128}));
                //         return false;
                //     } else if (v.length < 1) {
                //         this.ui.code.validateField('failed', _t('characters_min', {count: 1}));
                //         return false;
                //     }
                //
                //     if (v === this.ui.name.val().trim()) {
                //         this.ui.code.validateField('failed', 'Code and name must be different');
                //         return false;
                //     }
                //
                //     return true;
                // },

                validateName: function() {
                    let v = this.ui.name.val().trim();

                    if (v.length > 128) {
                        this.ui.name.validateField('failed', _t('characters_max', {count: 128}));
                        return false;
                    } else if (v.length < 1) {
                        this.ui.name.validateField('failed', _t('characters_min', {count: 1}));
                        return false;
                    }

                    // if (v === this.ui.code.val().trim()) {
                    //     this.ui.name.validateField('failed', 'Code and name must be different');
                    //     return false;
                    // }

                    return true;
                },

                validate: function() {
                    let valid = this.validateName();
                    let layoutId = parseInt(this.ui.layout.val());
                    let primaryClassificationEntryId = parseInt(this.ui.primary_classification_entry.val());

                    if (isNaN(layoutId)) {
                        $.alert.error(_t("The layout of descriptors must be defined"));
                        valid = false;
                    }

                    if (isNaN(primaryClassificationEntryId)) {
                        $.alert.error(_t("The primary classification must be defined"));
                        valid = false;
                    }

                    // @todo could have an API to validate naming options to uses here
                     if (this.ui.name.hasClass('invalid') || this.ui.primary_classification_entry.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onContinue: function() {
                    let view = this;

                    if (this.validate()) {
                        let name = this.ui.name.val().trim();
                        let namingOptions = this.getChildView('namingOptions').getNamingOptions();

                        let layoutId = parseInt(this.ui.layout.val());
                        let primaryClassificationEntryId = parseInt(this.ui.primary_classification_entry.val());

                        // create a new local model and open an edit view with this model
                        let model = new AccessionModel({
                            name: name,
                            naming_options: namingOptions,
                            primary_classification_entry: primaryClassificationEntryId,
                            layout: layoutId,
                            language: this.ui.language.val()
                        });

                        view.destroy();

                        let defaultLayout = new DefaultLayout();
                        window.application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Accession"),
                            model: model
                        }));

                        let accessionLayout = new AccessionLayout({model: model});
                        defaultLayout.showChildView('content', accessionLayout);
                    }
                }
            });

            let createAccessionView = new CreateAccessionDialog();
            createAccessionView.render();
        });
    },

    search: function () {
        let searchEntityDialog = new SearchEntityDialog({entity: 'accession.accession'});
        searchEntityDialog.render();
     }
});

module.exports = Controller;
