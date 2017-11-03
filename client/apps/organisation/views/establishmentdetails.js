/**
 * @file establishmentdetails.js
 * @brief Details view for establishment.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-04-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let Dialog = require('../../main/views/dialog');
let OrganisationModel = require('../models/organisation');

let View = Marionette.View.extend({
    tagName: "div",
    template: require('../templates/establishmentdetails.html'),
    templateContext: function () {
        return {
            organisation: this.organisation
        };
    },

    organisation: {id: -1, name: ''},
    noLink: false,

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        'view_organisation': ".view-organisation",
        'change_name': '.change-name'
    },

    events: {
        'click @ui.view_organisation': 'onViewOrganisation',
        'click @ui.change_name': 'onChangeName'
    },

    initialize: function(options) {
        this.mergeOptions(options, ['organisation']);

        this.listenTo(this.model, 'change:name', this.render, this);
        this.listenTo(this.model, 'change:parent', this.updateOrganisation, this);
    },

    updateOrganisation: function(model, value) {
        let view = this;

        // update the organisation
        this.organisation = new OrganisationModel({id: value});
        this.organisation.fetch().then(function() {
            view.render();
        });
    },

    onRender: function() {
        if (this.getOption('noLink')) {
            this.ui.view_organisation.removeClass('action');
        }
    },

    onChangeName: function () {
        let EditEstablishment = Dialog.extend({
            template: require('../templates/establishmentedit.html'),

            attributes: {
                id: "dlg_edit_establishment"
            },

            ui: {
                name: "#establishment_name"
            },

            events: {
                'click @ui.apply': 'onApply',
                'input @ui.name': 'onNameInput'
            },

            initialize: function (options) {
                EditEstablishment.__super__.initialize.apply(this);
            },

            onRender: function () {
                EditEstablishment.__super__.onRender.apply(this);

                this.ui.name.val(this.getOption('model').get('name'));
            },

            onBeforeDestroy: function () {
                EditEstablishment.__super__.onBeforeDestroy.apply(this);
            },

            onNameInput: function () {
                let name = this.ui.name.val().trim();
                let establishment_id = this.model.get('id');

                if (this.validateName()) {
                    let filters = {
                        method: 'ieq',
                        fields: ['name'],
                        'name': name
                    };

                    $.ajax({
                        type: "GET",
                        url: window.application.url(['organisation', 'establishment', 'search']),
                        dataType: 'json',
                        data: {filters: JSON.stringify(filters)},
                        el: this.ui.name,
                        success: function (data) {
                            if (data.items.length > 0) {
                                for (let i in data.items) {
                                    let e = data.items[i];

                                    if (e.value.toUpperCase() === name.toUpperCase() && e.id !== establishment_id) {
                                        $(this.el).validateField('failed', _t('Establishment name already in usage'));
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

            onApply: function() {
                let model = this.getOption('model');
                let name = this.ui.name.val().trim();

                let data = {};

                if (name !== model.get('name')) {
                    data.name = name;
                }

                if (model.isNew()) {
                    if (name !== model.get('name')) {
                        model.set('name', name);
                    }
                } else {
                    model.save(data, {patch: true, wait: true});
                }

                this.destroy();
            }
        });

        let editEstablishment = new EditEstablishment({
            model: this.model
        });

        editEstablishment.render();
    },

    onViewOrganisation: function (e) {
        if (this.getOption('noLink')) {
            return;
        }

        Backbone.history.navigate("app/organisation/organisation/" + this.organisation.get('id') + "/", {trigger: true});
    }
});

module.exports = View;
