/**
 * @file classificationentry.js
 * @brief Classification entry controller
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var Dialog = require('../../main/views/dialog');
var ClassificationEntryLayout = require('../views/classificationentrylayout');

var ClassificationEntryModel = require('../models/classificationentry');


var Controller = Marionette.Object.extend({
    create: function() {
        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + 'classification.classificationentry/',
            dataType: 'json'
        }).done(function(data) {
            var CreateClassificationEntryDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_classification_entry'
                },
                template: require('../templates/classificationentrycreate.html'),
                templateContext: function () {
                    return {
                        meta_models: data
                    };
                },

                ui: {
                    create: "button.create",
                    language: "#classification_entry_language",
                    descriptor_meta_model: "#meta_model",
                    name: "#classification_entry_name",
                    classification: "#classification",
                    rank: "#classification_rank",
                    parent: "#classification_entry_parent",
                    parent_group: ".classification-entry-parent-group"
                },

                events: {
                    'click @ui.create': 'onCreate',
                    'input @ui.name': 'onNameInput',
                    'change @ui.descriptor_meta_model': 'onChangeDescriptorMetaModel',
                    'change @ui.classification': 'onChangeClassification',
                    'change @ui.rank': 'onChangeRank'
                },

                initialize: function (options) {
                    CreateClassificationEntryDialog.__super__.initialize.apply(this, arguments);

                    // map descriptor meta models by theirs ids
                    this.descriptorMetaModels = {};

                    for (var i = 0; i < data.length; ++i) {
                        var dmm = data[i];
                        this.descriptorMetaModels[dmm.id] = dmm;
                    }
                },

                onRender: function () {
                    CreateClassificationEntryDialog.__super__.onRender.apply(this);

                    this.ui.parent_group.hide();

                    application.main.views.languages.drawSelect(this.ui.language);

                    this.ui.descriptor_meta_model.selectpicker({});
                    this.ui.classification.selectpicker({});
                    this.ui.rank.selectpicker({});

                    // on default descriptor meta-model
                    this.onChangeDescriptorMetaModel();
                },

                onBeforeDestroy: function () {
                    this.ui.descriptor_meta_model.selectpicker('destroy');
                    this.ui.classification.selectpicker('destroy');
                    this.ui.rank.selectpicker('destroy');

                    if (this.ui.parent.data('select2')) {
                        this.ui.parent.select2('destroy');
                    }

                    CreateClassificationEntryDialog.__super__.onBeforeDestroy.apply(this);
                },

                getDescriptorMetaModelClassifications: function () {
                    var descriptorMetaModelId = parseInt(this.ui.descriptor_meta_model.val());

                    var value = Object.resolve(descriptorMetaModelId + ".parameters.data.classification", this.descriptorMetaModels);
                    if (value) {
                        return [value];
                    }

                    return [];
                },

                onChangeDescriptorMetaModel: function() {
                    var select = this.ui.classification;

                    select.children().remove();
                    select.selectpicker('destroy');

                    // classifications list according to the related meta model of accession
                    var ClassificationCollection = require('../../classification/collections/classification');
                    var classificationCollection = new ClassificationCollection();

                    var SelectOption = require('../../main/renderers/selectoption');
                    var classifications = new SelectOption({
                        className: "classification",
                        collection: classificationCollection,
                        filters: [{
                            type: 'term',
                            field: 'id',
                            value: this.getDescriptorMetaModelClassifications(),
                            op: 'in'
                        }]
                    });

                    var self = this;

                    classifications.drawSelect(select).done(function () {
                        self.onChangeClassification();
                    });
                },

                onChangeClassification: function () {
                    var classificationId = parseInt(this.ui.classification.val());
                    var select = $(this.ui.rank);

                    select.children().remove();
                    select.selectpicker('destroy');

                    if (isNaN(classificationId)) {
                        return;
                    }

                    // classifications rank list according to the related classification
                    var ClassificationRankCollection = require('../../classification/collections/classificationrank');
                    var classificationRankCollection = new ClassificationRankCollection([], {classification_id: classificationId});

                    var SelectOption = require('../../main/renderers/selectoption');
                    var classificationRanks = new SelectOption({
                        className: "classification-rank",
                        collection: classificationRankCollection
                    });

                    var self = this;

                    classificationRanks.drawSelect(select).done(function () {
                        self.classificationRanks = {};

                        for (var i = 0; i < classificationRankCollection.models.length; ++i) {
                            self.classificationRanks[classificationRankCollection.models[i].get('id')] =
                                classificationRankCollection.models[i].get('level');
                        }

                        self.onChangeRank();
                    });
                },

                onChangeRank: function () {
                    var classificationId = parseInt(this.ui.classification.val());
                    var classificationRankId = parseInt(this.ui.rank.val());
                    var level = this.classificationRanks[classificationRankId];
                    var select = $(this.ui.parent);

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

                    select.select2({
                        dropdownParent: select.parent(),
                        ajax: {
                            url: application.baseUrl + "classification/classificationentry/search/",
                            dataType: 'json',
                            delay: 250,
                            data: function (params) {
                                params.term || (params.term = '');

                                return {
                                    filters: JSON.stringify({
                                        method: 'icontains',
                                        classification_method: 'eq',
                                        fields: ['name', 'classification', 'level'],
                                        'name': params.term.trim(),
                                        'classification': classificationId,
                                        'level': level
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
                        minimumInputLength: 1,
                        placeholder: gt.gettext("Enter a classification entry name.")
                    }).fixSelect2Position();
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
                            url: application.baseUrl + 'classification/classificationentry/synonym/search/',
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name,
                            success: function (data) {
                                if (data.items.length > 0) {
                                    for (var i in data.items) {
                                        var t = data.items[i];

                                        if (t.label.toUpperCase() === name.toUpperCase()) {
                                            $(this.el).validateField('failed', gt.gettext('Classification entry name already in usage'));
                                            break;
                                        }
                                    }
                                } else {
                                    $(this.el).validateField('ok');
                                }
                            }
                        });
                    }
                },

                validateName: function () {
                    var v = this.ui.name.val().trim();

                    if (v.length > 128) {
                        $(this.ui.name).validateField('failed', gt.gettext("128 characters max"));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
                        return false;
                    }

                    return true;
                },

                validate: function () {
                    var valid = this.validateName();

                    // need parent if not family
                    var rankId = parseInt(this.ui.rank.val());
                    var parentId = 0;

                    if (this.ui.parent.val()) {
                        parentId = parseInt(this.ui.parent.val());
                    }

                    if (this.classificationRanks[rankId] === 0 && parentId !== 0) {
                        $.alert.error(gt.gettext("Root rank cannot have a parent"));
                        valid = false;
                    }

                    if (this.classificationRanks[rankId] > 0 && parentId === 0) {
                        $.alert.error(gt.gettext("A parent must be specified"));
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
                    var view = this;

                    if (this.validate()) {
                        var name = this.ui.name.val().trim();

                        var descriptorMetaModelId = parseInt(this.ui.descriptor_meta_model.val());
                        var rankId = parseInt(this.ui.rank.val());
                        var parentId = parseInt(this.ui.parent.val()) || null;

                        // create a new local model and open an edit view with this model
                        var model = new ClassificationEntryModel({
                            name: name,
                            descriptor_meta_model: descriptorMetaModelId,
                            parent: parentId,
                            rank: rankId,
                            language: this.ui.language.val()
                        });

                        view.destroy();

                        var defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: gt.gettext("Classification entry"),
                            model: model
                        }));

                        var classificationEntryLayout = new ClassificationEntryLayout({model: model});
                        defaultLayout.showChildView('content', classificationEntryLayout);
                    }
                }
            });

            var dialog = new CreateClassificationEntryDialog();
            dialog.render();
        });
    }
});

module.exports = Controller;
