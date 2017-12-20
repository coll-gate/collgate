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
let Dialog = require('../../main/views/dialog');

let Controller = Marionette.Object.extend({
    create: function(collection) {
        let ClassificationCreate = Dialog.extend({
            template: require('../templates/classificationcreate.html'),

            attributes: {
                id: "dlg_create_classification",
            },

            ui: {
                name: "input[name=name]",
                label: "input[name=label]",
                description: "textarea[name=description]"
            },

            events: {
                'input @ui.name': 'onNameInput',
                'input @ui.label': 'onLabelInput'
            },

            initialize: function (options) {
                ClassificationCreate.__super__.initialize.apply(this);
            },

            onRender: function () {
                this.ui.name.val(this.getOption('name'));

                ClassificationCreate.__super__.onRender.apply(this);
            },

            onApply: function () {
                if (!this.validateName() || !this.validateLabel()) {
                    return;
                }

                let view = this;
                let collection = this.getOption('collection');
                let name = this.ui.name.val().trim();
                let label = this.ui.label.val().trim();
                let description = this.ui.description.val();

                collection.create({
                    name: name,
                    label: label,
                    description: description
                }, {
                    wait: true,
                    success: function () {
                        view.destroy();
                    },
                    error: function () {
                        $.alert.error(_t("Unable to create the classification !"));
                    }
                });
            },

            validateLabel: function () {
                let v = this.ui.label.val().trim();

                if (v.length < 3) {
                    $(this.ui.label).validateField('failed', _t('characters_min', {count: 3}));
                    return false;
                }

                return true;
            },

            onLabelInput: function () {
                if (this.validateLabel()) {
                    $(this.ui.label).validateField('ok');
                }
            },

            validateName: function() {
                let v = this.ui.name.val().trim();
                let re = /^[a-zA-Z0-9_\-]+$/i;

                if (v.length > 0 && !re.test(v)) {
                    this.ui.name.validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
                    return false;
                } else if (v.length < 3) {
                    this.ui.name.validateField('failed', _t('characters_min', {count: 3}));
                    return false;
                } else if (v.length > 128) {
                    this.ui.name.validateField('failed', _t('characters_max', {count: 128}));
                    return false;
                }

                return true;
            },

            onNameInput: function () {
                let self = this;

                if (this.validateName()) {
                    $.ajax({
                        type: "GET",
                        url: window.application.url(['classification', 'classification', 'search']),
                        dataType: 'json',
                        data: {
                            filters: JSON.stringify({
                                method: 'ieq',
                                fields: 'name',
                                name: this.ui.name.val()
                            })
                        },
                    }).done(function (data) {
                        if (data.items.length > 0) {
                            for (let i in data.items) {
                                let t = data.items[i];

                                if (t.name.toUpperCase() === self.ui.name.val().toUpperCase()) {
                                    self.ui.name.validateField('failed', _t('Classification name already in usage'));
                                    break;
                                }
                            }
                        } else {
                            self.ui.name.validateField('ok');
                        }
                    });
                }
            }
        });

        let classificationCreate = new ClassificationCreate({collection: collection});
        classificationCreate.render();
    },
});

module.exports = Controller;
