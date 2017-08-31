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
    // @todo must select the classification and then the rank
    create: function() {
        var CreateClassificationEntryView = Dialog.extend({
            attributes: {
                'id': 'dlg_create_classification_entry'
            },
            template: require('../templates/classificationentrycreate.html'),

            ui: {
                create: "button.create",
                language: "#classification_entry_language",
                name: "#classification_entry_name",
                rank: "#classification_rank",
                parent: "#classification_entry_parent",
                parent_group: ".classification-entry-parent-group"
            },

            events: {
                'click @ui.create': 'onCreate',
                'input @ui.name': 'onNameInput',
                'change @ui.rank': 'onChangeRank'
            },

            onRender: function () {
                CreateClassificationEntryView.__super__.onRender.apply(this);

                this.ui.parent_group.hide();

                application.main.views.languages.drawSelect(this.ui.language);
                application.classification.views.classificationRanks.drawSelect(this.ui.rank);

                $(this.ui.parent).select2({
                    dropdownParent: $(this.el),
                    ajax: {
                        url: application.baseUrl + "classification/classificationentry/search/",
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            return {
                                filters: JSON.stringify({
                                    method: 'icontains',
                                    fields: ['name', 'rank'],
                                    'name': params.term.trim(),
                                    'rank': parseInt($("#classification_rank").val())
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
                    placeholder: gt.gettext("Enter a classification entry name. 3 characters at least for auto-completion"),
                });

                $(this.ui.parent).on('select2:select', function (e) {
                    //var id = e.params.data.id;
                });
            },

            onBeforeDestroy: function() {
                this.ui.language.selectpicker('destroy');
                this.ui.rank.selectpicker('destroy');

                CreateClassificationEntryView.__super__.onBeforeDestroy.apply(this);
            },

            // @todo
            onChangeRank: function () {
                // reset parent
                $(this.ui.parent).val('').trigger('change');

                if (this.ui.rank.val() === "60")
                    this.ui.parent_group.hide();
                else
                    this.ui.parent_group.show();
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
                        success: function(data) {
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

            validateName: function() {
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

            validate: function() {
                var valid = this.validateName();

                // need parent if not family
                var rankId = parseInt(this.ui.rank.val());
                var parentId = 0;

                if ($(this.ui.parent).val()) {
                    parentId = parseInt($(this.ui.parent).val());
                }

                // @todo rank/level
                if (rankId === 60 && parentId !== 0) {
                    $.alert.error(gt.gettext("Family rank cannot have a parent classification entry"));
                    valid = false;
                }

                if (rankId > 60 && parentId <= 0) {
                    $.alert.error(gt.gettext("This rank must have a parent classification entry"));
                    valid = false;
                }

                if (this.ui.name.hasClass('invalid') || this.ui.parent.hasClass('invalid') || this.ui.rank.hasClass('invalid')) {
                    valid = false;
                }

                return valid;
            },

            onCreate: function() {
                var view = this;
                var name = this.ui.name.val().trim();

                if (this.validate()) {
                    application.classification.collections.classificationEntries.create({
                        name: name,
                        rank: parseInt(this.ui.rank.val()),
                        parent: parseInt($(this.ui.parent).val() || '0'),
                        synonyms: [{
                            name: this.ui.name.val(),
                            type: 0,  // primary
                            language: this.ui.language.val()
                        }]
                    }, {
                        wait: true,
                        success: function (model, resp, options) {
                            view.destroy();
                            $.alert.success(gt.gettext("Classification entry successfully created !"));
                        }
                    });
                }
            }
        });

        var dialog = new CreateClassificationEntryView();
        dialog.render();
    },

    /*createCultivar: function () {
        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + 'classification.classificationentry/',
            dataType: 'json'
        }).done(function(data) {
            var CreateTaxonCultivarView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_taxon_cultivar'
                },
                template: require('../templates/taxoncreatecultivar.html'),
                templateContext: function () {
                    return {
                        meta_models: data
                    };
                },

                ui: {
                    create: "button.create",
                    language: "#taxon_language",
                    name: "#taxon_name",
                    parent: "#taxon_parent",
                    meta_model: "#meta_model"
                },

                events: {
                    'click @ui.create': 'onCreate',
                    'input @ui.name': 'onNameInput'
                },

                onRender: function () {
                    CreateTaxonCultivarView.__super__.onRender.apply(this);

                    application.main.views.languages.drawSelect(this.ui.language);
                    this.ui.meta_model.selectpicker({});

                    $(this.ui.parent).select2({
                        dropdownParent: $(this.el),
                        ajax: {
                            url: application.baseUrl + "classification/classificationentry/search/",
                            dataType: 'json',
                            delay: 250,
                            data: function (params) {
                                params.term || (params.term = '');

                                return {
                                    filters: JSON.stringify({
                                        method: 'icontains',
                                        fields: ['name', 'rank'],
                                        'name': params.term.trim(),
                                        'rank': 90
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
                        placeholder: gt.gettext("Enter a classificationEntry name. 3 characters at least for auto-completion"),
                    });

                    $(this.ui.parent).on('select2:select', function (e) {
                        //var id = e.params.data.id;
                    });
                },

                onBeforeDestroy: function () {
                    this.ui.language.selectpicker('destroy');
                    this.ui.meta_model.selectpicker('destroy');

                    CreateTaxonCultivarView.__super__.onBeforeDestroy.apply(this);
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
                                            $(this.el).validateField('failed', gt.gettext('Taxon name already in usage'));
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

                    if (this.ui.name.hasClass('invalid') || this.ui.parent.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onCreate: function () {
                    var view = this;
                    var name = this.ui.name.val().trim();
                    var metaModel = parseInt(this.ui.meta_model.val());

                    if (this.validate() && !Number.isNaN(metaModel)) {
                        // create a new local model and open an edit view with this model
                        var model = new TaxonModel({
                            name: name,
                            rank: 90,  // cultivar rank level
                            parent: parseInt(this.ui.parent.val() || '0'),
                            descriptor_meta_model: metaModel,
                            language: this.ui.language.val(),
                            synonyms: [{
                                name: this.ui.name.val(),
                                type: 0,  // primary
                                language: this.ui.language.val()
                            }]
                        });

                        view.destroy();

                        var defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: gt.gettext("Cultivar"),
                            model: model
                        }));

                        var taxonLayout = new TaxonLayout({model: model});
                        defaultLayout.showChildView('content', taxonLayout);
                    }
                }
            });

            var createTaxonCultivarView = new CreateTaxonCultivarView();
            createTaxonCultivarView.render();
        });
    }*/
});

module.exports = Controller;
