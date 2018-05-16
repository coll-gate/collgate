/**
 * @file classificationentrysynonyms.js
 * @brief Classification entry synonyms view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'classification-entry-synonyms',
    template: require('../templates/classificationentrysynonyms.html'),

    ui: {
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "classification_entry_synonym_type": ".entity-synonym-types",
        "add_synonym": ".add-synonym",
        "remove_synonym": ".remove-synonym",
        "add_synonym_panel": "tr.add-synonym-panel",
        "rename_synonym": "td.rename-synonym"
    },

    events: {
        'input @ui.synonym_name': 'onSynonymNameInput',
        'click @ui.add_synonym': 'onAddSynonym',
        'click @ui.remove_synonym': 'onRemoveSynonym',
        'click @ui.rename_synonym': 'onRenameSynonym',
        'change @ui.classification_entry_synonym_type': 'onChangeSynonymType',
        'change @ui.synonym_language': 'onChangeSynonymLanguage'
    },

    templateContext: function () {
        return {
            classification_entry_code: window.application.main.collections.entitySynonymTypes.findWhere({name: "classification_entry_code"}).get('id'),
            classification_entry_name: window.application.main.collections.entitySynonymTypes.findWhere({name: "classification_entry_name"}).get('id')
        };
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        window.application.main.views.entitySynonymTypes.drawSelect(
            this.ui.classification_entry_synonym_type, true, false, null, {target_model: 'classification.classificationentry'});

        window.application.main.views.languages.htmlFromValue(this.el);
        window.application.main.views.entitySynonymTypes.htmlFromValue(this.el);

        // disable non multiple synonym types
        for (let i = 0; i < this.model.get('synonyms').length; ++i) {
            let st = window.application.main.collections.entitySynonymTypes.get(this.model.get('synonyms')[i].synonym_type);
            if (!st.get('multiple_entry')) {
                let name = st.get('name');
                this.ui.classification_entry_synonym_type.find('option[name=' + name + ']').prop('disabled', true);
            }
        }

        this.ui.classification_entry_synonym_type.selectpicker('refresh');

        this.onChangeSynonymType();
    },

    onChangeSynonymType: function () {
        let synonymTypeId = parseInt(this.ui.classification_entry_synonym_type.val());
        if (!isNaN(synonymTypeId)) {
            let synonymType = window.application.main.collections.entitySynonymTypes.get(synonymTypeId);

            // enable/disable and default language
            if (synonymType.get('has_language')) {
                window.application.main.views.languages.drawSelect(this.ui.synonym_language);
                this.ui.synonym_language.prop('disabled', false).val(window.session.language).selectpicker('refresh');
            } else {
                window.application.main.views.languages.drawSelect(this.ui.synonym_language, true, true);
                this.ui.synonym_language.prop('disabled', true).val('').selectpicker('refresh');
            }
        }

        this.ui.synonym_name.cleanField();
    },

    onChangeSynonymLanguage: function () {
        // force revalidation
        this.onSynonymNameInput();
    },

    validateName: function() {
        let v = this.ui.synonym_name.val().trim();

        if (v.length > 128) {
            $(this.ui.synonym_name).validateField('failed', _t('characters_max', {count: 128}));
            return false;
        } else if (v.length < 1) {
            $(this.ui.synonym_name).validateField('failed',_t('characters_min', {count: 1}));
            return false;
        }

        return true;
    },

    onSynonymNameInput: function () {
        if (this.validateName()) {
            let synonymTypeId = parseInt(this.ui.classification_entry_synonym_type.val());
            let synonymType = window.application.main.collections.entitySynonymTypes.get(synonymTypeId);
            let language = this.ui.synonym_language.val();

            let self = this;
            let name = this.ui.synonym_name.val().trim();

                let filters = {
                fields: ["name", "synonym_type"],
                method: "ieq",
                name: name,
                synonym_type: synonymTypeId
            };

            if (synonymType.get('has_language')) {
                filters.fields.push('language');
                filters.language = language;
            }

            if (synonymType.get('unique') || synonymType.get('has_language')) {
                $.ajax({
                    type: "GET",
                    url: window.application.url(['classification', 'classificationentry', 'synonym', 'search']),
                    dataType: 'json',
                    data: {filters: JSON.stringify(filters)},
                    cache: false,
                }).done(function (data) {
                    if (data.items.length > 0) {
                        for (let i in data.items) {
                            let t = data.items[i];

                            // name must be unique
                            if (t.label.toUpperCase() === name.toUpperCase()) {
                                if (synonymType.get('has_language')) {
                                    self.ui.synonym_name.validateField(
                                        'failed', _t('This synonym exists with this language and type'));
                                } else {
                                    self.ui.synonym_name.validateField(
                                        'failed', _t('The synonym must be unique for this type'));
                                }

                                return;
                            }
                        }
                    }

                    // validate
                    self.ui.synonym_name.validateField('ok');
                });
            } else {
                // validate
                self.ui.synonym_name.validateField('ok');
            }
        }
    },

    onAddSynonym: function () {
        if (this.validateName() && !this.ui.synonym_name.hasClass('invalid')) {
            let self = this;
            let synonymType = parseInt(this.ui.classification_entry_synonym_type.val());
            let name = $(this.ui.synonym_name).val().trim();
            let language = $(this.ui.synonym_language).val();

            $.ajax({
                type: "POST",
                url: this.model.url() + 'synonym/',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify({synonym_type: synonymType, name: name, language: language})
            }).done(function (data) {
                //self.model.addSynonym(type, name, language);
                //self.render();
                self.model.fetch({reset: true});
            });
        }
    },

    onRemoveSynonym: function (e) {
        let synonym = $(e.target.parentNode.parentNode);
        let synonymId = $(e.target).data('synonym-id');
        let self = this;

        $.ajax({
            type: "DELETE",
            url: this.model.url() + 'synonym/' + synonymId + '/',
            contentType: "application/json; charset=utf-8"
        }).done(function(data) {
            //self.model.removeSynonym(type, name, language);
            //self.render();
            self.model.fetch({reset: true});
        });
    },

    onRenameSynonym: function(e) {
        let parentSelf = this;

        let ChangeSynonym = Dialog.extend({
            template: require('../templates/classificationentrychangesynonym.html'),

            attributes: {
                id: "dlg_change_synonym"
            },

            ui: {
                synonym_name: "input[name=synonym-name]"
            },

            events: {
                'input @ui.synonym_name': 'onSynonymNameInput'
            },

            initialize: function (options) {
                ChangeSynonym.__super__.initialize.apply(this);
            },

            onSynonymNameInput: function () {
                if (this.validateName()) {
                    let synonymTypeId = this.getOption('synonym_type');
                    let synonymType = window.application.main.collections.entitySynonymTypes.get(synonymTypeId);

                    let self = this;
                    let name = this.ui.synonym_name.val().trim();

                    let filters = {
                        fields: ["name", "synonym_type"],
                        method: "ieq",
                        name: name,
                        synonym_type: this.getOption('synonym_type')
                    };

                    if (synonymType.get('has_language')) {
                        filters.fields.push('language');
                        filters.language = this.getOption('language');
                    }

                    if (synonymType.get('unique') || synonymType.get('has_language')) {
                        $.ajax({
                            type: "GET",
                            url: window.application.url(['classification', 'classificationentry', 'synonym', 'search']),
                            dataType: 'json',
                            data: {filters: JSON.stringify(filters)},
                            cache: false
                        }).done(function (data) {
                            if (data.items.length > 0) {
                                for (let i in data.items) {
                                    let t = data.items[i];

                                    if ((t.classification_entry === self.model.get('id')) && (t.id === self.getOption('synonym_id'))) {
                                        // valid if same classification entry and same synonym
                                        self.ui.synonym_name.validateField('ok');
                                        return;
                                    } else if (t.label.toUpperCase() === name.toUpperCase()) {
                                        // name must be unique
                                        if (synonymType.get('has_language')) {
                                            self.ui.synonym_name.validateField(
                                                'failed', _t('This synonym exists with this language and type'));
                                        } else {
                                            self.ui.synonym_name.validateField(
                                                'failed', _t('The synonym must be unique for this type'));
                                        }

                                        return;
                                    }
                                }
                            }

                            self.ui.synonym_name.validateField('ok');
                        });
                    } else {
                        self.ui.synonym_name.validateField('ok');
                    }
                }
            },

            validateName: function() {
                let v = this.ui.synonym_name.val().trim();

                if (v.length < 3) {
                    $(this.ui.synonym_name).validateField('failed', _t('characters_min', {count: 3}));
                    return false;
                } else if (v.length > 64) {
                    $(this.ui.synonym_name).validateField('failed', _t('characters_max', {count: 64}));
                    return false;
                } else {
                    $(this.ui.synonym_name).validateField('ok');
                    return true;
                }
            },

            onApply: function() {
                let self = this;
                let synonymId = this.getOption('synonym_id');
                let name = this.ui.synonym_name.val().trim();

                if (!this.ui.synonym_name.hasClass('invalid')) {
                    $.ajax({
                        type: "PUT",
                        url: this.model.url() + 'synonym/' + synonymId + '/',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify({name: name})
                    }).done(function (data) {
                        //self.model.renameSynonym(self.getOption('type'), name, self.getOption('language'), self.getOption('name'));
                        self.destroy();
                        self.model.fetch({reset: true});
                    }).fail(function() {
                        self.destroy();
                    });
                }
            }
        });

        let synonym = $(e.target.parentNode);
        let synonymId = $(e.target).data('synonym-id');

        let synonymType = parseInt(synonym.find("[name='synonym-type']").attr('value'));
        let name = synonym.find("[name='name']").text();
        let language = synonym.find("[name='language']").attr('value');

        let changeSynonym = new ChangeSynonym({
            model: this.model,
            synonym_id: synonymId,
            name: name,
            synonym_type: synonymType,
            language: language
        });

        changeSynonym.render();
        changeSynonym.ui.synonym_name.val(name);
    },

    onShowTab: function() {
        window.application.main.defaultRightView();
    }
});

module.exports = View;
