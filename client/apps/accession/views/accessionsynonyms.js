/**
 * @file accessionsynonyms.js
 * @brief Accession synonyms view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-16
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.View.extend({
    tagName: 'div',
    className: 'accession-synonyms',
    template: require('../templates/accessionsynonyms.html'),

    ui: {
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "accession_synonym_type": ".accession-synonym-types",
        "add_synonym": ".add-synonym",
        "remove_synonym": ".remove-synonym",
        "add_synonym_panel": "tr.add-synonym-panel",
        "rename_synonym": "td.rename-synonym"
    },

    events: {
        'input @ui.synonym_name': 'onSynonymNameInput',
        'click @ui.add_synonym': 'onAddSynonym',
        'click @ui.remove_synonym': 'onRemoveSynonym',
        'click @ui.rename_synonym': 'onRenameSynonym'
    },

    templateContext: function () {
        return {
            accession_code: application.accession.collections.accessionSynonymTypes.findWhere({name: "accession_code"}).get('id'),
            accession_name: application.accession.collections.accessionSynonymTypes.findWhere({name: "accession_name"}).get('id')
        };
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.languages.drawSelect(this.ui.synonym_language, true, true);
        application.accession.views.accessionSynonymTypes.drawSelect(this.ui.accession_synonym_type);

        application.main.views.languages.htmlFromValue(this.el);
        application.accession.views.accessionSynonymTypes.htmlFromValue(this.el);

        // remove GRC code and Primary Name
        /*for (var i = 0; i < application.accession.views.accessionSynonymTypes.collection.models.length; ++i) {
            var st = application.accession.views.accessionSynonymTypes.collection.models[i];

            if (st.get('unique')) {
                for (var j = 0; j < this.collection.models.length; ++j) {
                    if (this.collection.models[j].get('synonym_type') === st.get('id')) {
                        this.ui.accession_synonym_type.find('option[name=' + st.name + ']').disabled('true');
                    }
                }
            }

            if (st.get('has_language')) {

            }
        }*/
        // this.ui.accession_synonym_type.find('option[name=accession_code]').remove();
        // this.ui.accession_synonym_type.find('option[name=accession_name]').remove();
        // this.ui.accession_synonym_type.selectpicker('refresh');
    },

    validateName: function() {
        var v = this.ui.synonym_name.val().trim();

        if (v.length > 128) {
            $(this.ui.synonym_name).validateField('failed', _t('characters_max', {count: 128}));
            return false;
        } else if (v.length < 1) {
            $(this.ui.synonym_name).validateField('failed', _t('characters_min', {count: 1}));
            return false;
        }

        return true;
    },

    onSynonymNameInput: function () {
        if (this.validateName()) {
            var self = this;
            var name = this.ui.synonym_name.val().trim();

            var filters = {
                fields: ["name"],
                method: "ieq",
                name: name
            };

            $.ajax({
                type: "GET",
                url: application.baseUrl + 'accession/accession/synonym/search/',
                dataType: 'json',
                data: {filters: JSON.stringify(filters)},
                cache: false
            }).done(function(data) {
                var accessionCodeId = self.templateContext()['accession_code'];

                if (data.items.length > 0) {
                    for (var i in data.items) {
                        var t = data.items[i];

                        // invalid if GRC code exists with the same name or if exists into the same accession
                        if (t.label.toUpperCase() === name.toUpperCase()) {
                            if (t.synonym_type === accessionCodeId) {
                                self.ui.synonym_name.validateField(
                                    'failed', _t('It is not possible to use a GRC code of accession as synonym'));
                                return;
                            } else if (t.accession === self.model.get('id')) {
                                self.ui.synonym_name.validateField(
                                    'failed', _t('Synonym of accession already defined into this accession'));
                                return;
                            }
                        }
                    }
                }

                // validate
                self.ui.synonym_name.validateField('ok');
            });
        }
    },

    onAddSynonym: function () {
        if (this.validateName() && !this.ui.synonym_name.hasClass('invalid')) {
            var synonymType = parseInt(this.ui.accession_synonym_type.val());
            var name = this.ui.synonym_name.val().trim();
            var language = this.ui.synonym_language.val();
            var self = this;

            $.ajax({
                type: "POST",
                url: this.model.url() + 'synonym/',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify({synonym_type: synonymType, name: name, language: language})
            }).done(function (data) {
                self.model.fetch({reset: true});
            });
        }
    },

    onRemoveSynonym: function (e) {
        var synonym = $(e.target.parentNode.parentNode);
        var synonymId = $(e.target).data('synonym-id');
        var self = this;

        $.ajax({
            type: "DELETE",
            url: this.model.url() + 'synonym/' + synonymId + '/',
            contentType: "application/json; charset=utf-8"
        }).done(function (data) {
            self.model.fetch({reset: true});
        });
    },

    onRenameSynonym: function(e) {
        var parentSelf = this;

        var ChangeSynonym = Dialog.extend({
            template: require('../templates/accessionchangesynonym.html'),

            attributes: {
                id: "dlg_change_synonym"
            },

            ui: {
                synonym_name: "#accession_synonym_name"
            },

            events: {
                'input @ui.synonym_name': 'onNameInput'
            },

            initialize: function (options) {
                ChangeSynonym.__super__.initialize.apply(this, arguments);
            },

            onNameInput: function () {
                if (this.validateName()) {
                    var self = this;
                    var name = this.ui.synonym_name.val().trim();

                    var filters = {
                        fields: ["name"],
                        method: "ieq",
                        name: name
                    };

                    $.ajax({
                        type: "GET",
                        url: application.baseUrl + 'accession/accession/synonym/search/',
                        dataType: 'json',
                        data: {filters: JSON.stringify(filters)},
                        cache: false
                    }).done(function(data) {
                        var accessionCodeId = parentSelf.templateContext()['accession_code'];

                        if (data.items.length > 0) {
                            for (var i in data.items) {
                                var t = data.items[i];

                                // @todo
                                if (t.label.toUpperCase() === name.toUpperCase()) {
                                    // valid if same accession and same synonym
                                    if ((t.accession === self.model.get('id')) && (t.id === self.getOption('synonym_id'))) {
                                        self.ui.synonym_name.validateField('ok');
                                        break;
                                    } else if (self.getOption('synonym_type') === accessionCodeId) {
                                        // invalid if same name and modifying a GRC code synonym
                                        self.ui.synonym_name.validateField(
                                            'failed', _t('Accession GRC code must be unique'));
                                        break;
                                    } else if (t.synonym_type === accessionCodeId) {
                                        // invalid if GRC code exists with the same name
                                        self.ui.synonym_name.validateField(
                                            'failed', _t('It is not possible to use a GRC code of accession as synonym'));
                                        break;
                                    } else if (t.accession === self.model.get('id')) {
                                        // invalid if exists into the same accession
                                        self.ui.synonym_name.validateField(
                                            'failed', _t('Synonym of accession already defined into this accession'));
                                        break;
                                    }
                                }
                            }
                        } else {
                            self.ui.synonym_name.validateField('ok');
                        }
                    });
                }
            },

            validateName: function() {
                var v = this.ui.synonym_name.val().trim();

                if (v.length < 1) {
                    $(this.ui.synonym_name).validateField('failed', _t('characters_min', {count: 1}));
                    return false;
                } else if (v.length > 128) {
                    $(this.ui.synonym_name).validateField('failed', _t('characters_max', {count: 128}));
                    return false;
                } else {
                    $(this.ui.synonym_name).validateField('ok');
                    return true;
                }
            },

            onApply: function() {
                var self = this;
                var synonym_id = this.getOption('synonym_id');
                var name = this.ui.synonym_name.val().trim();

                if (!this.ui.synonym_name.hasClass('invalid')) {
                    $.ajax({
                        type: "PUT",
                        url: this.model.url() + 'synonym/' + synonym_id + '/',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify({name: name})
                    }).done(function() {
                        self.model.fetch({reset: true});
                    }).always(function() {
                        self.destroy();
                    });
                }
            }
        });

        var synonym = $(e.target.parentNode);
        var synonymId = $(e.target).data('synonym-id');

        var synonymType = parseInt(synonym.find("[name='synonym-type']").attr('value'));
        var name = synonym.find("[name='name']").text();
        var language = synonym.find("[name='language']").attr('value');

        var changeSynonym = new ChangeSynonym({
            model: this.model,
            synonym_id: synonymId,
            name: name,
            synonym_type: synonymType,
            language: language
        });

        changeSynonym.render();
        changeSynonym.ui.synonym_name.val(name);
    }
});

module.exports = View;
