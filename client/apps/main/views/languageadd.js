/**
 * @file languagelistfooter.js
 * @brief Create new languages
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-06-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'language-add',
    template: require('../templates/languageadd.html'),

    ui: {
        add_language_btn: 'span.add-language',
        add_language_code: 'input.language-code',
    },

    events: {
        'click @ui.add_language_btn': 'addLanguage',
        'input @ui.add_language_code': 'onCodeNameInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    addLanguage: function () {
        this.validateCodeName();

        if (!this.ui.add_language_code.hasClass('invalid')) {
            let CreateLanguageDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_language'
                },
                template: require('../templates/languagecreate.html'),

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
                    let label = this.ui.label.val().trim();

                    if (this.validateLabel()) {

                    }
                },

                onRender: function () {
                    CreateLanguageDialog.__super__.onRender.apply(this);

                    this.ui.code.val(this.getOption('code'));
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

                        this.getOption('collection').create({
                            code: this.getOption('code'), label: label}, {wait: true});

                        view.destroy();
                    }
                }
            });

            // show current language label dialog
            let createLanguageDialog = new CreateLanguageDialog({
                collection: this.collection,
                code: this.ui.add_language_code.val()});
            createLanguageDialog.render();

            this.ui.add_language_code.cleanField();
        }
    },

    validateCodeName: function() {
        let v = this.ui.add_language_code.val();
        let re = /^[a-zA-Z]{2}([_-][a-zA-Z]{2})*$/;

        if (v.length > 0 && !re.test(v)) {
            this.ui.add_language_code.validateField('failed', _t("Invalid format"));
            return false;
        } else if (v.length < 2) {
            this.ui.add_language_code.validateField('failed', _t('characters_min', {count: 2}));
            return false;
        }

        return true;
    },

    onCodeNameInput: function () {
        if (this.validateCodeName()) {
            if (this.collection.get(this.ui.add_language_code.val())) {
                this.ui.add_language_code.validateField('failed', _t('Language code already in usage'));
            } else {
                this.ui.add_language_code.validateField('ok');
            }
        }
    },
});

module.exports = View;
