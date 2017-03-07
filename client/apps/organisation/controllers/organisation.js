/**
 * @file organisation.js
 * @brief Organisation controller
 * @author Frederic SCHERMA
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var OrganisationModel = require('../models/organisation');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var Dialog = require('../../main/views/dialog');
var OrganisationLayout = require('../views/organisationlayout');


var Controller = Marionette.Object.extend({

    create: function() {
        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + 'organisation.organisation/',
            dataType: 'json'
        }).done(function(data) {
            var CreateOrganisationView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_organisation'
                },
                template: require('../templates/organisationcreate.html'),

                ui: {
                    create: "button.create",
                    grc: "#organisation_grc",
                    name: "#organisation_name",
                    type: "#organisation_type"
                },

                events: {
                    'click @ui.create': 'onCreate',
                    'input @ui.name': 'onNameInput'
                },

                onRender: function () {
                    CreateOrganisationView.__super__.onRender.apply(this);

                    application.organisation.views.organisationTypes.drawSelect(this.ui.type);

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
                                        fields: ['name', 'rank'],
                                        'name': params.term.trim(),
                                        'rank': parseInt($("#taxon_rank").val())
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
                        placeholder: gt.gettext("Enter a taxon name. 3 characters at least for auto-completion"),
                    });
                },

                onBeforeDestroy: function () {
                    this.ui.type.selectpicker('destroy');

                    CreateOrganisationView.__super__.onBeforeDestroy.apply(this);
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
                            url: application.baseUrl + 'organisation/organisation/search/',
                            dataType: 'json',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name,
                            success: function (data) {
                                if (data.items.length > 0) {
                                    for (var i in data.items) {
                                        var t = data.items[i];

                                        if (t.value.toUpperCase() == name.toUpperCase()) {
                                            $(this.el).validateField('failed', gt.gettext('Organisation name already in usage'));
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

                    if (v.length > 64) {
                        $(this.ui.name).validateField('failed', gt.gettext("64 characters max"));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
                        return false;
                    }

                    return true;
                },

                validate: function () {
                    var valid = this.validateName();

                    if (this.ui.name.hasClass('invalid') || this.ui.type.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onCreate: function () {
                    var name = this.ui.name.val().trim();
                    var to_grc = this.ui.grc.val() === "grc-partner";

                    if (this.validate()) {
                        var model = new OrganisationModel({
                            descriptor_meta_model: data[0].id,
                            name: name,
                            type: this.ui.type.val(),
                            grc: to_grc
                        });

                        this.destroy();

                        var defaultLayout = new DefaultLayout();
                        application.show(defaultLayout);

                        defaultLayout.getRegion('title').show(new TitleView({
                            title: gt.gettext("Organisation"),
                            model: model
                        }));

                        var organisationLayout = new OrganisationLayout({model: model});
                        defaultLayout.getRegion('content').show(organisationLayout);
                    }
                }
            });

            var dialog = new CreateOrganisationView();
            dialog.render();
        });
    }
});

module.exports = Controller;
