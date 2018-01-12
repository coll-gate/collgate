/**
 * @file descriptor.js
 * @brief Descriptor controller
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-01-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let DescriptorModel = require('../models/descriptor');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');

let DescriptorLayout = require('../views/descriptorlayout');

let Controller = Marionette.Object.extend({

    create: function () {
        let CreateDescriptorDialog = Dialog.extend({
            attributes: {
                'id': 'dlg_create_descriptor'
            },
            template: require('../templates/descriptorcreate.html'),

            ui: {
                validate: "button.continue",
                name: "input[name=name]",
                label: "input[name=label]"
            },

            events: {
                'click @ui.validate': 'onContinue',
                'input @ui.name': 'onNameInput',
                'input @ui.label': 'onLabelInput'
            },

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
                        url: window.application.url(['descriptor', 'descriptor', 'search']),
                        dataType: 'json',
                        contentType: 'application/json; charset=utf8',
                        data: {filters: JSON.stringify(filters)},
                    }).done(function (data) {
                        for (let i in data.items) {
                            let descriptor = data.items[i];

                            if (descriptor.name.toUpperCase() === name.toUpperCase()) {
                                self.ui.name.validateField('failed', _t('Name already used'));
                                return;
                            }
                        }
                        self.ui.name.validateField('ok');
                    });
                }
            },

            onLabelInput: function () {

            },

            validateName: function () {
                let v = this.ui.name.val().trim();

                if (v.length > 128) {
                    this.ui.name.validateField('failed', _t('characters_max', {count: 128}));
                    return false;
                } else if (v.length < 1) {
                    this.ui.name.validateField('failed', _t('characters_min', {count: 1}));
                    return false;
                }

                return true;
            },

            validateLabel: function () {
                let v = this.ui.name.val().trim();

                if (v.length > 128) {
                    this.ui.label.validateField('failed', _t('characters_max', {count: 128}));
                    return false;
                } else if (v.length < 1) {
                    this.ui.label.validateField('failed', _t('characters_min', {count: 1}));
                    return false;
                }

                return true;
            },

            validate: function () {
                let valid = this.validateName();

                if (this.ui.name.hasClass('invalid') ||
                    this.ui.label.hasClass('invalid')) {
                    valid = false;
                }

                return valid;
            },

            onContinue: function () {
                let view = this;

                if (this.validate()) {
                    let name = this.ui.name.val().trim();
                    let label = this.ui.label.val().trim();

                    // create a new local model and open an edit view with this model
                    let model = new DescriptorModel({
                        name: name,
                        label: label
                    });

                    view.destroy();

                    let defaultLayout = new DefaultLayout();
                    application.main.showContent(defaultLayout);

                    defaultLayout.showChildView('title', new TitleView({
                        title: _t("Descriptor"),
                        model: model
                    }));

                    let descriptorLayout = new DescriptorLayout({model: model});
                    defaultLayout.showChildView('content', descriptorLayout);
                }
            }
        });

        let createDescriptorView = new CreateDescriptorDialog();
        createDescriptorView.render();
    }
});

module.exports = Controller;
