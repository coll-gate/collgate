/**
 * @file establishmentlistfilter.js
 * @brief Filter the list of establishment
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-09
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var Dialog = require('../../main/views/dialog');
var EstablishmentModel = require('../models/establishment');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var EstablishmentLayout = require('../views/establishmentlayout');


var View = Marionette.View.extend({
    tagName: 'div',
    className: 'establishment-filter',
    template: require('../templates/establishmentlistfilter.html'),

    ui: {
        filter_btn: 'button.establishment-filter',
        establishment_name: 'input.establishment-name',
        create_establishment: 'button.create-establishment'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'input @ui.establishment_name': 'onEstablishmentNameInput',
        'click @ui.create_establishment': 'onCreateEstablishment'
    },

    initialize: function(options) {
        this.collection = options.collection;
    },

    onRender: function() {
    },

    onFilter: function () {
        if (this.validateEstablishmentName()) {
            this.collection.filters = {
                name_code: this.ui.establishment_name.val().trim(),
                method: "icontains"
            };

            this.collection.fetch({reset: true});
        }
    },

    validateEstablishmentName: function() {
        var v = this.ui.establishment_name.val().trim();

        if (v.length > 0 && v.length < 3) {
            $(this.ui.establishment_name).validateField('failed', gt.ngettext('characters_min', 'characters_min', {count: 3}));
            return false;
        } else if (this.ui.establishment_name.val().length === 0) {
            $(this.ui.establishment_name).cleanField();
            return true;
        } else {
            $(this.ui.establishment_name).validateField('ok');
            return true;
        }
    },

    onEstablishmentNameInput: function () {
        return this.validateEstablishmentName();
    },

    onCreateEstablishment: function() {
        var view = this;

        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + 'organisation.establishment/',
            dataType: 'json'
        }).done(function(data) {
            var CreateEstablishmentView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_establishment'
                },
                template: require('../templates/establishmentcreate.html'),

                ui: {
                    create: "button.create",
                    organisation: "#organisation_name",
                    name: "#establishment_name"
                },

                events: {
                    'click @ui.create': 'onCreate',
                    'input @ui.name': 'onNameInput'
                },

                initialize: function(options) {
                    options || (options = {});

                    Dialog.__super__.initialize.apply(this, options);
                },

                onRender: function () {
                    CreateEstablishmentView.__super__.onRender.apply(this);

                    // defines organisation name
                    this.ui.organisation.val(this.getOption('organisation').get('name'));
                },

                onBeforeDestroy: function () {
                    CreateEstablishmentView.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    var name = this.ui.name.val().trim();

                    if (this.validateName()) {
                        var filters = {
                            method: 'ieq',
                            fields: ['name'],
                            name: name
                        };

                        $.ajax({
                            type: "GET",
                            url: application.baseUrl + 'organisation/establishment/search/',
                            dataType: 'json',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name,
                            success: function (data) {
                                if (data.items.length > 0) {
                                    for (var i in data.items) {
                                        var t = data.items[i];

                                        if (t.value.toUpperCase() === name.toUpperCase()) {
                                            $(this.el).validateField('failed', gt.gettext('Establishment name already in usage'));
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

                    if (v.length > 255) {
                        $(this.ui.name).validateField('failed', gt.ngettext('characters_max', 'characters_max', {count: 255}));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', gt.ngettext('characters_min', 'characters_min', {count: 3}));
                        return false;
                    }

                    return true;
                },

                validate: function () {
                    var valid = this.validateName();

                    if (this.ui.name.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onCreate: function () {
                    var name = this.ui.name.val().trim();

                    if (this.validate()) {
                        var model = new EstablishmentModel({
                            descriptor_meta_model: data[0].id,
                            name: name,
                            organisation: this.getOption('organisation').get('id')
                        });

                        this.destroy();

                        var defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: gt.gettext("Establishment"),
                            model: model,
                            organisation: this.getOption('organisation').get('id')
                        }));

                        var establishmentLayout = new EstablishmentLayout({model: model});
                        defaultLayout.showChildView('content', establishmentLayout);
                    }
                }
            });

            var dialog = new CreateEstablishmentView({
                organisation: view.getOption('organisation'),
                collection: view.collection
            });

            dialog.render();
        });
    }
});

module.exports = View;
