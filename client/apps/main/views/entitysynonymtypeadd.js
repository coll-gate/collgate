/**
 * @file entitysynonymtypeadd.js
 * @brief Create new entity synonym type
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'entity-synonym-type-add',
    template: require('../templates/entitysynonymtypeadd.html'),

    ui: {
        add_synonym_type_btn: 'span.add-entity-synonym-type',
        add_synonym_type_name: 'input.entity-synonym-type-name',
    },

    events: {
        'click @ui.add_synonym_type_btn': 'addSynonymType',
        'input @ui.add_synonym_type_name': 'onNameInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    addSynonymType: function () {
        this.validateName();

        if (!this.ui.add_synonym_type_name.hasClass('invalid')) {
            let CreateSynonymTypeDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_synonym_type'
                },
                template: require('../templates/entitysynonymtypecreate.html'),

                ui: {
                    add: "button.add",
                    name: "input[name=synonym-type]",
                    entity: "select[name=target-entity]",
                    label: "input[name=label]"
                },

                events: {
                    'click @ui.add': 'onAdd',
                    'input @ui.label': 'onLabelInput'
                },

                onLabelInput: function () {
                    let label = this.ui.label.val().trim();

                    if (this.validateLabel()) {

                    }
                },

                onRender: function () {
                    CreateSynonymTypeDialog.__super__.onRender.apply(this);

                    this.ui.name.val(this.getOption('name'));
                    this.ui.entity.selectpicker({});
                },

                validateLabel: function() {
                    let v = this.ui.label.val().trim();

                    if (v.length > 128) {
                        this.ui.label.validateField('failed', _t('characters_max', {count: 128}));
                        return false;
                    } else if (v.length < 3) {
                        this.ui.label.validateField('failed', _t('characters_min', {count: 3}));
                        return false;
                    }

                    this.ui.label.validateField('ok');

                    return true;
                },

                validate: function() {
                    let valid = this.validateLabel();
                    return valid;
                },

                onAdd: function() {
                    let view = this;

                    if (this.validate()) {
                        let label = this.ui.label.val().trim();
                        let targetModel = this.ui.entity.val();

                        this.getOption('collection').create({
                            name: this.getOption('name'),
                            target_model: targetModel,
                            label: label}, {wait: true});

                        view.destroy();
                    }
                }
            });

            // show current synonym type label dialog
            let createSynonymTypeDialog = new CreateSynonymTypeDialog({
                collection: this.collection,
                name: this.ui.add_synonym_type_name.val()});
            createSynonymTypeDialog.render();

            this.ui.add_synonym_type_name.cleanField();
        }
    },

    validateName: function() {
        let v = this.ui.add_synonym_type_name.val();
        let re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            this.ui.add_synonym_type_name.validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            this.ui.add_synonym_type_name.validateField('failed', _t('characters_min', {count: 3 }));
            return false;
        }

        return true;
    },

    onNameInput: function () {
        if (this.validateName()) {
            if (this.collection.findWhere({'name': this.ui.add_synonym_type_name.val()})) {
                this.ui.add_synonym_type_name.validateField('failed', _t('Entity synonym type name already in usage'));
            } else {
                this.ui.add_synonym_type_name.validateField('ok');
            }
        }
    },
});

module.exports = View;
