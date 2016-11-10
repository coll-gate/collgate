/**
 * @file taxondetails.js
 * @brief Taxon details item view
 * @author Frederic SCHERMA
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../models/taxon');

var Dialog = require('../../main/views/dialog');

var TaxonItemView = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'element object taxon',
    template: require('../templates/taxondetails.html'),

    ui: {
        "view_taxon": ".view-taxon",
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "taxon_synonym_type": ".taxon-synonym-types",
        "taxon_rank": ".taxon-ranks",
        "add_synonym": ".add-synonym",
        "remove_synonym": ".remove-synonym",
        "add_synonym_panel": "tr.add-synonym-panel",
        "rename_synonym": "td.rename-synonym",
        "change_parent": "span.change-parent",
    },

    events: {
        'input @ui.synonym_name': 'onSynonymNameInput',
        'click @ui.view_taxon': 'onViewTaxon',
        'click @ui.add_synonym': 'onAddSynonym',
        'click @ui.remove_synonym': 'onRemoveSynonym',
        'click @ui.rename_synonym': 'onRenameSynonym',
        'click @ui.change_parent': 'onChangeParent',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.languages.drawSelect(this.ui.synonym_language);
        application.taxonomy.views.taxonSynonymTypes.drawSelect(this.ui.taxon_synonym_type);
        application.taxonomy.views.taxonRanks.drawSelect(this.ui.taxon_rank);

        application.main.views.languages.htmlFromValue(this.el);
        application.taxonomy.views.taxonSynonymTypes.htmlFromValue(this.el);
        application.taxonomy.views.taxonRanks.htmlFromValue(this.el);

        //this.ui.taxon_synonym_type.find('option[value="0"]').remove();
        //$(this.ui.taxon_synonym_type).selectpicker('refresh');
    },

    validateName: function() {
        var v = this.ui.synonym_name.val();

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
            var filters = {
                fields: ["name"],
                method: "ieq",
                name: this.ui.synonym_name.val()
            };

            $.ajax({
                type: "GET",
                url: application.baseUrl + 'taxonomy/taxon/search/',
                dataType: 'json',
                data: {filters: JSON.stringify(filters)},
                cache: false,
                el: this.ui.synonym_name,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (var i in data.items) {
                            var t = data.items[i];

                            if (t.label.toUpperCase() == this.el.val().toUpperCase()) {
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
            var name = $(this.ui.synonym_name).val();
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
        var synonymId = $(e.target).data('synonym-id');

        var type = synonym.find("[name='type']").attr('value');
        var name = synonym.find("[name='name']").text();
        var language = synonym.find("[name='language']").attr('value');

        $.ajax({
            view: this,
            type: "DELETE",
            url: this.model.url() + 'synonym/' + synonymId + '/',
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
                name: "#name",
            },

            events: {
                'input @ui.name': 'onNameInput',
            },

            initialize: function (options) {
                ChangeSynonym.__super__.initialize.apply(this);
            },

            onNameInput: function () {
                this.validateName();
            },

            validateName: function() {
                var v = this.ui.name.val();

                if (v.length < 3) {
                    $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
                    return false;
                } else if (v.length > 64) {
                    $(this.ui.name).validateField('failed', gt.gettext('64 characters max'));
                    return false;
                }

                $(this.ui.name).validateField('ok');

                return true;
            },

            onApply: function() {
                var view = this;
                var model = this.getOption('model');
                var synonymId = this.getOption('synonymId');
                var name = this.ui.name.val();

                if (this.validateName()) {
                    $.ajax({
                        type: "PUT",
                        url: this.model.url() + 'synonym/' + synonymId + '/',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify({name: name}),
                        success: function (data) {
                            //view.model.renameSynonym(view.getOption('type'), name, view.getOption('language'), view.getOption('name'));
                            view.remove();

                            model.fetch({reset: true}).then(function() {
                                //var TitleView = require('../../main/views/titleview');

                                //application.getRegion('mainRegion').currentView.getRegion('title').show(
                                    //new TitleView({title: gt.gettext("Taxon details"), object: model.get('name')}));
                            });
                        },
                        error: function() {
                            $.alert.error(gt.gettext("Unable to rename the synonym !"));
                        }
                    });
                }
            },
        });

        var synonym = $(e.target.parentNode.parentNode);
        var synonymId = $(e.target).data('synonym-id');

        var type = synonym.find("[name='type']").attr('value');
        var name = synonym.find("[name='name']").text();
        var language = synonym.find("[name='language']").attr('value');

        var changeSynonym = new ChangeSynonym({
            model: this.model,
            synonymId: synonymId,
            name: e.target.innerHTML,
            type: type,
            language: language
        });

        changeSynonym.render();
        changeSynonym.ui.name.val(e.target.innerHTML);
    },

    onViewTaxon: function(e) {
        var taxon_id = $(e.target).data('taxon-id');

        Backbone.history.navigate("app/taxonomy/taxon/" + taxon_id + "/", {trigger: true});
    },

    onChangeParent: function () {
        var ChangeParent = Dialog.extend({
            template: require('../templates/taxonchangeparent.html'),

            attributes: {
                id: "dlg_change_parent",
            },

            ui: {
                parent: "#taxon_parent",
            },

            initialize: function (options) {
                ChangeParent.__super__.initialize.apply(this);
            },

            onRender: function () {
                ChangeParent.__super__.onRender.apply(this);

                var rank = this.model.get('rank');

                $(this.ui.parent).select2({
                    dropdownParent: $(this.el),
                    ajax: {
                        url: application.baseUrl + "taxonomy/taxon/search/",
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            var filters = {
                                method: 'icontains',
                                fields: ['name', 'rank'],
                                'name': params.term,
                                'rank': rank
                            };

                            return {
                                page: params.page,
                                filters: JSON.stringify(filters),
                            };
                        },
                        processResults: function (data, params) {
                            // no pagination
                            params.page = params.page || 1;

                            var results = [];

                            for (var i = 0; i < data.items.length; ++i) {
                                results.push({
                                    id: data.items[i].id,
                                    text: data.items[i].label
                                });
                            }

                            return {
                                results: results,
                                pagination: {
                                    more: (params.page * 30) < data.total_count
                                }
                            };
                        },
                        cache: true
                    },
                    minimumInputLength: 3,
                    placeholder: gt.gettext("Enter a taxon name. 3 characters at least for auto-completion"),
                });
            },

            onApply: function() {
                var model = this.getOption('model');
                var parent = null;

                if ($(this.ui.parent).val()) {
                    parent = parseInt($(this.ui.parent).val());
                }

                model.save({parent: parent}, {patch: true, wait: true});
                this.remove();
            },
        });

        var changeParent = new ChangeParent({
            model: this.model
        });

        changeParent.render();
    }
});

module.exports = TaxonItemView;
