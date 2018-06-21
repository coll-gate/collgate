/**
 * @file organisationdetails.js
 * @brief Details view for organisation.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
    tagName: "div",
    template: require('../templates/organisationdetails.html'),

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        'organisation_type': '.organisation-type',
        'change_type': '.change-type'
    },

    events: {
        'click @ui.change_type': 'onChangeType'
    },

    initialize: function(options) {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
       window.application.organisation.views.organisationTypes.htmlFromValue(this.el);
    },

    onChangeType: function () {
        let EditOrganisation = Dialog.extend({
            template: require('../templates/organisationedit.html'),

            attributes: {
                id: "dlg_edit_organisation"
            },

            ui: {
                name: "#organisation_name",
                type: "#organisation_type",
                grc: "#organisation_grc"
            },

            events: {
                'click @ui.apply': 'onApply',
                'input @ui.name': 'onNameInput'
            },

            initialize: function (options) {
                EditOrganisation.__super__.initialize.apply(this);
            },

            onRender: function () {
                EditOrganisation.__super__.onRender.apply(this);

                window.application.organisation.views.organisationTypes.drawSelect(this.ui.type);

                this.ui.name.val(this.getOption('model').get('name'));
                this.ui.type.selectpicker('val', this.getOption('model').get('type'));
                this.ui.grc.selectpicker({}).selectpicker('val', this.getOption('model').get('grc') > 0 ? '1' : '0');
            },

            onBeforeDestroy: function () {
                this.ui.type.selectpicker('destroy');
                this.ui.grc.selectpicker('destroy');

                EditOrganisation.__super__.onBeforeDestroy.apply(this);
            },

            onNameInput: function () {
                let name = this.ui.name.val().trim();
                let organisation_id = this.model.get('id');

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
                        el: this.ui.name
                    }).done(function (data) {
                        if (data.items.length > 0) {
                            for (let i in data.items) {
                                let t = data.items[i];

                                if (t.value.toUpperCase() === name.toUpperCase() && t.id !== organisation_id) {
                                    $(this.el).validateField('failed', _t('Organisation name already in usage'));
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
                let type = this.ui.type.val();
                let grc = this.ui.grc.val() > 0;

                let data = {};

                if (name !== model.get('name')) {
                    data.name = name;
                }

                if (type !== model.get('type')) {
                    data.type = type;
                }

                if (grc !== model.get('grc')) {
                    data.grc = grc;
                }

                if (model.isNew()) {
                    if (name !== model.get('name')) {
                        model.set('name', name);
                    }

                    if (type !== model.get('type')) {
                        model.set('type', type);
                    }

                    if (grc !== model.get('grc')) {
                        model.set('grc', grc);
                    }
                } else {
                    model.save(data, {patch: true, wait: true});
                }

                this.destroy();
            }
        });

        let editOrganisation = new EditOrganisation({
            model: this.model
        });

        editOrganisation.render();
    }
});

module.exports = View;
