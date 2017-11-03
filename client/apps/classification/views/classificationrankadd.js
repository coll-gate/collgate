/**
 * @file classificationrankadd.js
 * @brief Create a new classification rank.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'classification-rank-add',
    template: require('../templates/classificationrankadd.html'),

    ui: {
        add_classification_rank_btn: 'span.add-classification-rank',
        add_classification_rank_name: 'input.classification-rank-name',
    },

    events: {
        'click @ui.add_classification_rank_btn': 'addClassificationRank',
        'input @ui.add_classification_rank_name': 'onClassificationRankNameInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.classification = options.classification;
        this.collection = options.collection;
    },

    addClassificationRank: function () {
        let ClassificationRankCreate = Dialog.extend({
            template: require('../templates/classificationrankcreate.html'),

            attributes: {
                id: "dlg_create_classification_rank",
            },

            ui: {
                name: "input.classification-rank-name",
                label: "input.classification-rank-label",
                level: "input.classification-rank-level"
            },

            events: {
                'input @ui.label': 'onLabelInput',
            },

            initialize: function (options) {
                ClassificationRankCreate.__super__.initialize.apply(this, arguments);
            },

            onRender: function () {
                this.ui.name.val(this.getOption('name'));

                ClassificationRankCreate.__super__.onRender.apply(this);
            },

            onApply: function () {
                if (!this.validateLabel()) {
                    return;
                }

                let view = this;
                let collection = this.getOption('collection');
                let name = this.getOption('name');
                let label = this.ui.label.val();
                // let level = this.ui.level.val();

                collection.create({
                    name: name,
                    label: label,
                    // level: level
                }, {
                    wait: true,
                    success: function () {
                        view.destroy();
                    },
                    error: function () {
                        $.alert.error(_t("Unable to create the classification rank !"));
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

        if (!this.ui.add_classification_rank_name.hasClass('invalid')) {
            let classificationRankCreate = new ClassificationRankCreate({
                collection: this.collection,
                classification: this.classification,
                name: this.ui.add_classification_rank_name.val()
            });

            this.ui.add_classification_rank_name.cleanField();
            classificationRankCreate.render();
            classificationRankCreate.ui.name.prop('readonly', true);
        }
    },

    validateClassificationRankName: function() {
        let v = this.ui.add_classification_rank_name.val();
        let re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            this.ui.add_classification_rank_name.validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            this.ui.add_classification_rank_name.validateField('failed', _t('characters_min', {count: 3}));
            return false;
        } else if (v.length > 128) {
            this.ui.add_classification_rank_name.validateField('failed', _t('characters_max', {count: 128}));
            return false;
        }

        return true;
    },

    onClassificationRankNameInput: function () {
        if (this.validateClassificationRankName()) {
            $.ajax({
                type: "GET",
                url: window.application.url(['classification', 'classificationrank', 'search']),
                dataType: 'json',
                data: {
                    filters: JSON.stringify({
                        method: 'ieq',
                        fields: 'name',
                        name: this.ui.add_classification_rank_name.val()
                    })
                },
                view: this,
            }).done(function (data) {
                if (data.items.length > 0) {
                    for (let i in data.items) {
                        let t = data.items[i];

                        if (t.name.toUpperCase() === this.view.ui.add_classification_rank_name.val().toUpperCase()) {
                            this.view.ui.add_classification_rank_name.validateField('failed', _t('Classification rank name already in usage'));
                            break;
                        }
                    }
                } else {
                    this.view.ui.add_classification_rank_name.validateField('ok');
                }
            });
        }
    }
});

module.exports = View;
