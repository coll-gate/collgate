/**
 * @file classificationentry.js
 * @brief Classification entry controller
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');
let Search = require('../../main/utils/search');

let ClassificationEntryLayout = require('../views/classificationentrylayout');
let ClassificationEntryModel = require('../models/classificationentry');


let Controller = Marionette.Object.extend({
    create: function() {
        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'layout', 'for-describable', 'classification.classificationentry']),
            dataType: 'json'
        }).done(function(data) {
            let CreateClassificationEntryDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_classification_entry'
                },
                template: require('../templates/classificationentrycreate.html'),
                templateContext: function () {
                    return {
                        layouts: data
                    };
                },

                ui: {
                    create: "button.create",
                    language: "#classification_entry_language",
                    layout: "#layout",
                    name: "#classification_entry_name",
                    classification: "#classification",
                    rank: "#classification_rank",
                    parent: "#classification_entry_parent",
                    parent_group: ".classification-entry-parent-group"
                },

                events: {
                    'click @ui.create': 'onCreate',
                    'input @ui.name': 'onNameInput',
                    'change @ui.layout': 'onChangeDescriptorMetaModel',
                    'change @ui.classification': 'onChangeClassification',
                    'change @ui.rank': 'onChangeRank'
                },

                initialize: function (options) {
                    CreateClassificationEntryDialog.__super__.initialize.apply(this, arguments);

                    // map descriptor meta models by theirs ids
                    this.descriptorMetaModels = {};

                    for (let i = 0; i < data.length; ++i) {
                        let dmm = data[i];
                        this.descriptorMetaModels[dmm.id] = dmm;
                    }
                },

                onRender: function () {
                    CreateClassificationEntryDialog.__super__.onRender.apply(this);

                    this.ui.parent_group.hide();

                    application.main.views.languages.drawSelect(this.ui.language);

                    this.ui.layout.selectpicker({});
                    this.ui.classification.selectpicker({});
                    this.ui.rank.selectpicker({});

                    // on default descriptor layout
                    this.onChangeDescriptorMetaModel();
                },

                onBeforeDestroy: function () {
                    this.ui.layout.selectpicker('destroy');
                    this.ui.classification.selectpicker('destroy');
                    this.ui.rank.selectpicker('destroy');

                    if (this.ui.parent.data('select2')) {
                        this.ui.parent.select2('destroy');
                    }

                    CreateClassificationEntryDialog.__super__.onBeforeDestroy.apply(this);
                },

                getDescriptorMetaModelClassifications: function () {
                    let descriptorMetaModelId = parseInt(this.ui.layout.val());

                    let value = Object.resolve(descriptorMetaModelId + ".parameters.data.classification", this.descriptorMetaModels);
                    if (value) {
                        return [value];
                    }

                    return [];
                },

                onChangeDescriptorMetaModel: function() {
                    let select = this.ui.classification;

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
                            value: this.getDescriptorMetaModelClassifications(),
                            op: 'in'
                        }]
                    });

                    let self = this;

                    classifications.drawSelect(select).done(function () {
                        self.onChangeClassification();
                    });
                },

                onChangeClassification: function () {
                    let classificationId = parseInt(this.ui.classification.val());
                    let select = $(this.ui.rank);

                    select.children().remove();
                    select.selectpicker('destroy');

                    if (isNaN(classificationId)) {
                        return;
                    }

                    // classifications rank list according to the related classification
                    let ClassificationRankCollection = require('../../classification/collections/classificationrank');
                    let classificationRankCollection = new ClassificationRankCollection([], {classification_id: classificationId});

                    let SelectOption = require('../../main/renderers/selectoption');
                    let classificationRanks = new SelectOption({
                        className: "classification-rank",
                        collection: classificationRankCollection
                    });

                    let self = this;

                    classificationRanks.drawSelect(select).done(function () {
                        self.classificationRanks = {};

                        for (let i = 0; i < classificationRankCollection.models.length; ++i) {
                            self.classificationRanks[classificationRankCollection.models[i].get('id')] =
                                classificationRankCollection.models[i].get('level');
                        }

                        self.onChangeRank();
                    });
                },

                onChangeRank: function () {
                    let classificationId = parseInt(this.ui.classification.val());
                    let classificationRankId = parseInt(this.ui.rank.val());
                    let level = this.classificationRanks[classificationRankId];
                    let select = $(this.ui.parent);

                    if (level === 0) {
                        this.ui.parent_group.hide(false);
                    } else {
                        this.ui.parent_group.show(false);
                    }

                    if (select.data('select2')) {
                        select.select2('destroy');
                        select.children().remove();
                    }

                    if (isNaN(classificationId) || isNaN(classificationRankId)) {
                        return;
                    }

                    select.select2(Search(
                        select.parent(),
                        window.application.url(['classification', 'classificationentry', 'search']),
                        function (params) {
                            return {
                                method: 'icontains',
                                classification_method: 'eq',
                                fields: ['name', 'classification', 'level'],
                                'name': params.term.trim(),
                                'classification': classificationId,
                                'level': level
                            };
                        }, {
                                minimumInputLength: 1,
                            placeholder: _t("Enter a classification entry name.")
                        })
                    ).fixSelect2Position();
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
                            url: window.application.url(['classification', 'classificationentry', 'synonym', 'search']),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name
                        }).done(function (data) {
                            if (data.items.length > 0) {
                                for (let i in data.items) {
                                    let t = data.items[i];

                                    if (t.label.toUpperCase() === name.toUpperCase()) {
                                        $(this.el).validateField('failed', _t('Classification entry name already in usage'));
                                        break;
                                    }
                                }
                            } else {
                                $(this.el).validateField('ok');
                            }
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

                validate: function () {
                    let valid = this.validateName();

                    // need parent if not family
                    let rankId = parseInt(this.ui.rank.val());
                    let parentId = 0;

                    if (this.ui.parent.val()) {
                        parentId = parseInt(this.ui.parent.val());
                    }

                    if (this.classificationRanks[rankId] === 0 && parentId !== 0) {
                        $.alert.error(_t("Root rank cannot have a parent"));
                        valid = false;
                    }

                    if (this.classificationRanks[rankId] > 0 && parentId === 0) {
                        $.alert.error(_t("A parent must be specified"));
                        valid = false;
                    }

                    if (this.ui.name.hasClass('invalid') ||
                        this.ui.parent.hasClass('invalid') ||
                        this.ui.rank.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onCreate: function () {
                    let view = this;

                    if (this.validate()) {
                        let name = this.ui.name.val().trim();

                        let descriptorMetaModelId = parseInt(this.ui.layout.val());
                        let rankId = parseInt(this.ui.rank.val());
                        let parentId = parseInt(this.ui.parent.val()) || null;

                        // create a new local model and open an edit view with this model
                        let model = new ClassificationEntryModel({
                            name: name,
                            layout: descriptorMetaModelId,
                            parent: parentId,
                            rank: rankId,
                            language: this.ui.language.val()
                        });

                        view.destroy();

                        let defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Classification entry"),
                            model: model
                        }));

                        let classificationEntryLayout = new ClassificationEntryLayout({model: model});
                        defaultLayout.showChildView('content', classificationEntryLayout);
                    }
                }
            });

            let dialog = new CreateClassificationEntryDialog();
            dialog.render();
        });
    }
});

module.exports = Controller;
