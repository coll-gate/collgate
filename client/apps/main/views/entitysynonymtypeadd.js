/**
 * @file entitysynonymtypeadd.js
 * @brief Create new entity synonym type
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.View.extend({
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
            var CreateLanguageDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_language'
                },
                template: require('../templates/entitysynonymtypecreate.html'),

                ui: {
                    add: "button.add",
                    code: "#language_code",
                    label: "#language_label"
                },

                events: {
                    'click @ui.add': 'onAdd',
                    'input @ui.label': 'onLabelInput'
                },

                onLabelInput: function () {
                    var label = this.ui.label.val().trim();

                    if (this.validateLabel()) {

                    }
                },

                onRender: function () {
                    CreateLanguageDialog.__super__.onRender.apply(this);

                    this.ui.code.val(this.getOption('code'));
                },

                validateLabel: function() {
                    var v = this.ui.label.val().trim();

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
                    var valid = this.validateLabel();
                    return valid;
                },

                onAdd: function() {
                    var view = this;

                    if (this.validate()) {
                        var label = this.ui.label.val().trim();

                        this.getOption('collection').create({
                            code: this.getOption('code'), label: label}, {wait: true});

                        view.destroy();
                    }
                }
            });

            // show current language label dialog
            var createLanguageDialog = new CreateLanguageDialog({
                collection: this.collection,
                code: this.ui.add_language_code.val()});
            createLanguageDialog.render();

            this.ui.add_language_code.cleanField();
        }
    },

    validateName: function() {
        var v = this.ui.add_synonym_type_name.val();
        var re = /^[a-zA-Z0-9_\-]+$/i;

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
