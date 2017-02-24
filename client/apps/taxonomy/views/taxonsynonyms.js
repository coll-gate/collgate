/**
 * @file taxonsynonyms.js
 * @brief Taxon synonyms view
 * @author Frederic SCHERMA
 * @date 2016-12-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'taxon-synonyms',
    template: require('../templates/taxonsynonyms.html'),

    ui: {
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "taxon_synonym_type": ".taxon-synonym-types",
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
        application.taxonomy.views.taxonSynonymTypes.drawSelect(this.ui.taxon_synonym_type);

        application.main.views.languages.htmlFromValue(this.el);
        application.taxonomy.views.taxonSynonymTypes.htmlFromValue(this.el);

        this.ui.taxon_synonym_type.find('option[value="0"]').remove();
        $(this.ui.taxon_synonym_type).selectpicker('refresh');
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
            var name = this.ui.synonym_name.val().trim();

            var filters = {
                fields: ["name"],
                method: "ieq",
                name: name
            };

            $.ajax({
                type: "GET",
                url: application.baseUrl + 'taxonomy/taxon/synonym/search/',
                dataType: 'json',
                data: {filters: JSON.stringify(filters)},
                cache: false,
                el: this.ui.synonym_name,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (var i in data.items) {
                            var t = data.items[i];

                            if (t.label.toUpperCase() == name.toUpperCase()) {
                                $(this.el).validateField('failed', gt.gettext('Synonym of taxon already used'));
                                break;
                            }
                        }
                    } else {
                        $(this.el).validateField('ok');
                    }
                }
            });
        }
    },

    onAddSynonym: function () {
        if (this.validateName() && !this.ui.synonym_name.hasClass('invalid')) {
            var type = $(this.ui.taxon_synonym_type).val();
            var name = $(this.ui.synonym_name).val().trim();
            var language = $(this.ui.synonym_language).val();

            $.ajax({
                view: this,
                type: "POST",
                url: this.model.url() + 'synonym/',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify({type: type, name: name, language: language}),
                success: function (data) {
                    //this.view.model.addSynonym(type, name, language);
                    //this.view.render();
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
                //this.view.model.removeSynonym(type, name, language);
                //this.view.render();
                this.view.model.fetch({reset: true});
            }
        });
    },

    onRenameSynonym: function(e) {
        var ChangeSynonym = Dialog.extend({
            template: require('../templates/taxonchangesynonym.html'),

            attributes: {
                id: "dlg_change_synonym",
            },

            ui: {
                synonym_name: "#taxon_synonym_name",
            },

            events: {
                'input @ui.synonym_name': 'onSynonymNameInput',
            },

            initialize: function (options) {
                ChangeSynonym.__super__.initialize.apply(this);
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
                        url: application.baseUrl + 'taxonomy/taxon/synonym/search/',
                        dataType: 'json',
                        data: {filters: JSON.stringify(filters)},
                        cache: false,
                        el: this.ui.synonym_name,
                        success: function(data) {
                            if (data.items.length > 0) {
                                for (var i in data.items) {
                                    var t = data.items[i];

                                    if (t.label.toUpperCase() == name.toUpperCase()) {
                                        // same taxon, same synonym => valid
                                        if ((t.taxon == view.model.get('id')) && (t.id == view.getOption('synonym_id'))) {
                                            view.ui.synonym_name.validateField('ok');
                                            break;
                                        }

                                        $(this.el).validateField('failed', gt.gettext('Synonym of taxon already used'));
                                        break;
                                    }
                                }
                            } else {
                                $(this.el).validateField('ok');
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

                if (this.validateName()) {
                    $.ajax({
                        type: "PUT",
                        url: view.model.url() + 'synonym/' + synonym_id + '/',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify({name: name}),
                        success: function (data) {
                            //view.model.renameSynonym(view.getOption('type'), name, view.getOption('language'), view.getOption('name'));
                            view.destroy();

                            model.fetch({reset: true});
                        },
                        error: function() {
                            $.alert.error(gt.gettext("Unable to rename the synonym !"));
                        }
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
