/**
 * @file accession.js
 * @brief Accession controller
 * @author Frederic SCHERMA
 * @date 2016-12-07
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TaxonModel = require('../../taxonomy/models/taxon');
var AccessionModel = require('../models/accession');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var Dialog = require('../../main/views/dialog');
var AccessionLayout = require('../views/accessionlayout');

var EntityPathView = require('../../taxonomy/views/entitypath');
var AccessionDescriptorEditView = require('../views/accessiondescriptoredit');


var Controller = Marionette.Object.extend({

    create: function() {
        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + 'accession.accession/',
            dataType: 'json',
        }).done(function(data) {
            var CreateAccessionView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_accession',
                },
                template: require('../templates/accessioncreate.html'),
                templateHelpers/*templateContext*/: function () {
                    return {
                        meta_models: data,
                    };
                },

                ui: {
                    validate: "button.continue",
                    name: "#accession_name",
                    language: "#accession_language",
                    meta_model: "#meta_model",
                    parent: "#accession_parent"
                },

                events: {
                    'click @ui.validate': 'onContinue',
                    'input @ui.name': 'onNameInput'
                },

                onRender: function () {
                    CreateAccessionView.__super__.onRender.apply(this);

                    application.main.views.languages.drawSelect(this.ui.language);
                    this.ui.meta_model.selectpicker({});

                    $(this.ui.parent).select2({
                        dropdownParent: $(this.el),
                        ajax: {
                            url: application.baseUrl + "taxonomy/taxon/search/",
                            dataType: 'json',
                            delay: 250,
                            data: function (params) {
                                params.term || (params.term = '');

                                return {
                                    filters: JSON.stringify({
                                        method: 'icontains',
                                        fields: ['name'],
                                        'name': params.term
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
                        placeholder: gt.gettext("Enter a taxon name. 3 characters at least for auto-completion")
                    });
                },

                onBeforeDestroy: function() {
                    this.ui.language.selectpicker('destroy');
                    this.ui.meta_model.selectpicker('destroy');

                    CreateAccessionView.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    if (this.validateName()) {
                        var filters = {
                            method: 'ieq',
                            fields: ['name'],
                            'name': this.ui.name.val()
                        };

                        $.ajax({
                            type: "GET",
                            url: application.baseUrl + 'accession/accession/synonym/search/',
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name,
                            success: function(data) {
                                if (data.items.length > 0) {
                                    for (var i in data.items) {
                                        var t = data.items[i];

                                        if (t.value.toUpperCase() == this.el.val().toUpperCase()) {
                                            $(this.el).validateField('failed', gt.gettext('Synonym of accession already used'));
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
                    var v = this.ui.name.val();

                    if (v.length > 64) {
                        $(this.ui.name).validateField('failed', gt.gettext("64 characters max"));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
                        return false;
                    }

                    return true;
                },

                validate: function() {
                    var valid = this.validateName();

                    var parentId = 0;

                    if (this.ui.parent.val())
                        parentId = parseInt(this.ui.parent.val());

                    if (parentId == 0) {
                        $.alert.error(gt.gettext("The parent must be defined"));
                        valid = false;
                    }

                    if (this.ui.name.hasClass('invalid') || this.ui.parent.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onContinue: function() {
                    var view = this;

                    if (this.validate()) {
                        var name = this.ui.name.val();
                        var parent = parseInt(this.ui.parent.val());
                        var metaModel = parseInt(this.ui.meta_model.val());

                        // create a new local model and open an edit view with this model
                        var model = new AccessionModel({
                            name: name,
                            parent: parent,
                            descriptor_meta_model: metaModel,
                            language: this.ui.language.val()
                        });

                        view.destroy();

                        var defaultLayout = new DefaultLayout();
                        application.show(defaultLayout);

                        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accession"), model: model}));

                        var accessionLayout = new AccessionLayout({model: model});
                        defaultLayout.getRegion('content').show(accessionLayout);
/*
                        accessionLayout.disableSynonymsTab();
                        accessionLayout.disableBatchesTab();

                        var taxon = new TaxonModel({id: parent});
                        taxon.fetch().then(function() {
                            accessionLayout.getRegion('details').show(new EntityPathView({model: model, taxon: taxon, noLink: true}));
                        });

                        $.ajax({
                            method: "GET",
                            url: application.baseUrl + 'descriptor/meta-model/' + metaModel + '/layout/',
                            dataType: 'json'
                        }).done(function(data) {
                            var accessionDescriptorView = new AccessionDescriptorEditView({model: model, descriptorMetaModelLayout: data});
                            accessionLayout.getRegion('descriptors').show(accessionDescriptorView);

                            // manually called
                            accessionDescriptorView.onShowTab();
                        });*/
                    }
                }
            });

            var createAccessionView = new CreateAccessionView();
            createAccessionView.render();
        });
    },
});

module.exports = Controller;