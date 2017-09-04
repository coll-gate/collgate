/**
 * @file classificationcreate.js
 * @brief Create a new classification.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.View.extend({
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
        var ClassificationCreate = Dialog.extend({
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

                var view = this;
                var collection = this.getOption('collection');
                var name = this.getOption('name');
                var label = this.ui.label.val();
                var description = this.ui.description.val();

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
                        $.alert.error(gt.gettext("Unable to create the classification !"));
                    }
                });
            },

            validateLabel: function () {
                var v = this.ui.label.val();

                if (v.length < 3) {
                    $(this.ui.label).validateField('failed', gt.gettext('3 characters min'));
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
            var classificationCreate = new ClassificationCreate({
                collection: this.collection,
                name: this.ui.add_classification_name.val()
            });

            this.ui.add_classification_name.cleanField();
            classificationCreate.render();
            classificationCreate.ui.name.prop('readonly', true);
        }
    },

    validateClassificationName: function() {
        var v = this.ui.add_classification_name.val();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.add_classification_name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            $(this.ui.add_classification_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        }

        return true;
    },

    onClassificationNameInput: function () {
        if (this.validateClassificationName()) {
            $.ajax({
                type: "GET",
                url: application.baseUrl + 'classification/classification/search/',
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
                    for (var i in data.items) {
                        var t = data.items[i];

                        if (t.name.toUpperCase() === this.el.val().toUpperCase()) {
                            this.view.ui.add_classification_name.validateField('failed', gt.gettext('Classification name already in usage'));
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
