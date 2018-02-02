/**
 * @file organisation.js
 * @brief Organisation controller
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let OrganisationModel = require('../models/organisation');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');
let OrganisationLayout = require('../views/organisationlayout');


let Controller = Marionette.Object.extend({

    create: function() {
        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'layout', 'for-describable', 'organisation.organisation']),
            dataType: 'json'
        }).done(function(data) {
            let CreateOrganisationView = Dialog.extend({
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

                    this.ui.grc.selectpicker({
                        style: 'btn-default',
                        container: 'body'
                    });
                },

                onBeforeDestroy: function () {
                    this.ui.type.selectpicker('destroy');
                    this.ui.grc.selectpicker('destroy');

                    CreateOrganisationView.__super__.onBeforeDestroy.apply(this);
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
                            url: window.application.url(['organisation', 'organisation', 'search']),
                            dataType: 'json',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name,
                            success: function (data) {
                                if (data.items.length > 0) {
                                    for (let i in data.items) {
                                        let t = data.items[i];

                                        if (t.value.toUpperCase() === name.toUpperCase()) {
                                            $(this.el).validateField('failed', _t('Organisation name already in usage'));
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
                    let v = this.ui.name.val().trim();

                    if (v.length > 255) {
                        $(this.ui.name).validateField('failed', _t('characters_max', {count: 255}));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
                        return false;
                    }

                    return true;
                },

                validate: function () {
                    let valid = this.validateName();

                    if (this.ui.name.hasClass('invalid') || this.ui.type.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onCreate: function () {
                    let name = this.ui.name.val().trim();
                    let to_grc = this.ui.grc.val() === "grc-partner";

                    if (this.validate()) {
                        let model = new OrganisationModel({
                            layout: data[0].id,
                            name: name,
                            type: this.ui.type.val(),
                            grc: to_grc
                        });

                        this.destroy();

                        let defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Organisation"),
                            model: model
                        }));

                        let organisationLayout = new OrganisationLayout({model: model});
                        defaultLayout.showChildView('content', organisationLayout);
                    }
                }
            });

            let dialog = new CreateOrganisationView();
            dialog.render();
        });
    }
});

module.exports = Controller;
