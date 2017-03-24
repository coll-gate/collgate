/**
 * @file accessionsynonyms.js
 * @brief Accession synonyms view
 * @author Frederic SCHERMA
 * @date 2017-01-16
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.ItemView.extend({
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

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.languages.drawSelect(this.ui.synonym_language);
        application.accession.views.accessionSynonymTypes.drawSelect(this.ui.accession_synonym_type);

        application.main.views.languages.htmlFromValue(this.el);
        application.accession.views.accessionSynonymTypes.htmlFromValue(this.el);

        // remove GRC code and Primary Name
        this.ui.accession_synonym_type.find('option[value="ACC_SYN:01"]').remove();
        this.ui.accession_synonym_type.find('option[value="ACC_SYN:02"]').remove();
        this.ui.accession_synonym_type.selectpicker('refresh');
    },

    validateName: function() {
        var v = this.ui.synonym_name.val().trim();

        if (v.length > 64) {
            $(this.ui.synonym_name).validateField('failed', gt.gettext("64 characters max"));
            return false;
        } else if (v.length < 3) {
            $(this.ui.synonym_name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        }

        return true;
    },

    onSynonymNameInput: function () {
        if (this.validateName()) {
            var view = this;
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
                cache: false,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (var i in data.items) {
                            var t = data.items[i];

                            // invalid if GRC code exists with the same name or if exists into the same accession
                            if (t.label.toUpperCase() == name.toUpperCase()) {
                                if (t.type == "ACC_SYN:01") {
                                    view.ui.synonym_name.validateField(
                                        'failed', gt.gettext('It is not possible to use a GRC code of accession as synonym'));
                                    return;
                                } else if (t.accession == view.model.get('id')) {
                                    view.ui.synonym_name.validateField(
                                        'failed', gt.gettext('Synonym of accession already defined into this accession'));
                                    return;
                                }
                            }
                        }
                    }

                    // validate
                    view.ui.synonym_name.validateField('ok');
                }
            });
        }
    },

    onAddSynonym: function () {
        if (this.validateName() && !this.ui.synonym_name.hasClass('invalid')) {
            var type = this.ui.accession_synonym_type.val();
            var name = this.ui.synonym_name.val().trim();
            var language = this.ui.synonym_language.val();

            $.ajax({
                view: this,
                type: "POST",
                url: this.model.url() + 'synonym/',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify({type: type, name: name, language: language}),
                success: function (data) {
                    this.view.model.fetch({reset: true});
                }
            });
        }
    },

    onRemoveSynonym: function (e) {
        var synonym = $(e.target.parentNode.parentNode);
        var synonym_id = $(e.target).data('synonym-id');

        $.ajax({
            view: this,
            type: "DELETE",
            url: this.model.url() + 'synonym/' + synonym_id + '/',
            contentType: "application/json; charset=utf-8",
            success: function(data) {
                this.view.model.fetch({reset: true});
            }
        });
    },

    onRenameSynonym: function(e) {
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
                ChangeSynonym.__super__.initialize.apply(this);
            },

            onNameInput: function () {
                if (this.validateName()) {
                    var view = this;
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
                        cache: false,
                        success: function(data) {
                            if (data.items.length > 0) {
                                for (var i in data.items) {
                                    var t = data.items[i];

                                    if (t.label.toUpperCase() == name.toUpperCase()) {
                                        // valid if same accession and same synonym
                                        if ((t.accession == view.model.get('id')) && (t.id == view.getOption('synonym_id'))) {
                                            view.ui.synonym_name.validateField('ok');
                                            break;
                                        } else if (view.getOption('type') == "ACC_SYN:01") {
                                            // invalid if same name and modifying a GRC code synonym
                                            view.ui.synonym_name.validateField(
                                                'failed', gt.gettext('Accession GRC code must be unique'));
                                            break;
                                        } else if (t.type == "ACC_SYN:01") {
                                            // invalid if GRC code exists with the same name
                                            view.ui.synonym_name.validateField(
                                                'failed', gt.gettext('It is not possible to use a GRC code of accession as synonym'));
                                            break;
                                        } else if (t.accession == view.model.get('id')) {
                                            // invalid if exists into the same accession
                                            view.ui.synonym_name.validateField(
                                                'failed', gt.gettext('Synonym of accession already defined into this accession'));
                                            break;
                                        }
                                    }
                                }
                            } else {
                                view.ui.synonym_name.validateField('ok');
                            }
                        }
                    });
                }
            },

            validateName: function() {
                var v = this.ui.synonym_name.val().trim();

                if (v.length < 3) {
                    $(this.ui.synonym_name).validateField('failed', gt.gettext('3 characters min'));
                    return false;
                } else if (v.length > 64) {
                    $(this.ui.synonym_name).validateField('failed', gt.gettext('64 characters max'));
                    return false;
                } else {
                    $(this.ui.synonym_name).validateField('ok');
                    return true;
                }
            },

            onApply: function() {
                var view = this;
                var model = this.getOption('model');
                var synonym_id = this.getOption('synonym_id');
                var name = this.ui.synonym_name.val().trim();

                if (!this.ui.synonym_name.hasClass('invalid')) {
                    $.ajax({
                        type: "PUT",
                        url: view.model.url() + 'synonym/' + synonym_id + '/',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify({name: name})
                    }).done(function() {
                        model.fetch({reset: true});
                    }).always(function() {
                        view.destroy();
                    });
                }
            }
        });

        var synonym = $(e.target.parentNode);
        var synonym_id = $(e.target).data('synonym-id');

        var type = synonym.find("[name='type']").attr('value');
        var name = synonym.find("[name='name']").text();
        var language = synonym.find("[name='language']").attr('value');

        var changeSynonym = new ChangeSynonym({
            model: this.model,
            synonym_id: synonym_id,
            name: name,
            type: type,
            language: language
        });

        changeSynonym.render();
        changeSynonym.ui.synonym_name.val(name);
    }
});

module.exports = View;
