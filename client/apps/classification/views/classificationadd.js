/**
 * @file classificationadd.js
 * @brief Create a new classification.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'classification-add',
    template: require('../templates/classificationadd.html'),

    ui: {
        add_classification_btn: 'span.add-classification',
        add_classification_name: 'input.classification-name',
    },

    events: {
        'click @ui.add_classification_btn': 'addClassification',
        'input @ui.add_classification_name': 'onClassificationNameInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    addClassification: function () {
        let ClassificationCreate = Dialog.extend({
            template: require('../templates/classificationcreate.html'),

            attributes: {
                id: "dlg_create_classification",
            },

            ui: {
                name: "#classification_name",
                label: "#classification_label",
                description: "#classification_description"
            },

            events: {
                'input @ui.label': 'onLabelInput',
            },

            initialize: function (options) {
                ClassificationCreate.__super__.initialize.apply(this);
            },

            onRender: function () {
                this.ui.name.val(this.getOption('name'));

                ClassificationCreate.__super__.onRender.apply(this);
            },

            onApply: function () {
                if (!this.validateLabel()) {
                    return;
                }

                let view = this;
                let collection = this.getOption('collection');
                let name = this.getOption('name');
                let label = this.ui.label.val();
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
                let v = this.ui.label.val();

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
            }
        });

        if (!this.ui.add_classification_name.hasClass('invalid')) {
            let classificationCreate = new ClassificationCreate({
                collection: this.collection,
                name: this.ui.add_classification_name.val()
            });

            this.ui.add_classification_name.cleanField();
            classificationCreate.render();
            classificationCreate.ui.name.prop('readonly', true);
        }
    },

    validateClassificationName: function() {
        let v = this.ui.add_classification_name.val();
        let re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            this.ui.add_classification_name.validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            this.ui.add_classification_name.validateField('failed', _t('characters_min', {count: 3}));
            return false;
        } else if (v.length > 128) {
            this.ui.add_classification_name.validateField('failed', _t('characters_max', {count: 128}));
            return false;
        }

        return true;
    },

    onClassificationNameInput: function () {
        if (this.validateClassificationName()) {
            $.ajax({
                type: "GET",
                url: window.application.url(['classification', 'classification', 'search']),
                dataType: 'json',
                data: {
                    filters: JSON.stringify({
                        method: 'ieq',
                        fields: 'name',
                        name: this.ui.add_classification_name.val()
                    })
                },
                view: this,
            }).done(function (data) {
                if (data.items.length > 0) {
                    for (let i in data.items) {
                        let t = data.items[i];

                        if (t.name.toUpperCase() === this.view.ui.add_classification_name.val().toUpperCase()) {
                            this.view.ui.add_classification_name.validateField('failed', _t('Classification name already in usage'));
                            break;
                        }
                    }
                } else {
                    this.view.ui.add_classification_name.validateField('ok');
                }
            });
        }
    }
});

module.exports = View;
