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

var TaxonItemView = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'element object taxon',
    template: require('../templates/taxondetails.html'),

    ui: {
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "taxon_synonym_type": ".taxon-synonym-types",
        "taxon_rank": ".taxon-ranks",
        "add_synonym": ".add-synonym",
        "remove_synonym": ".remove-synonym",
        "add_synonym_panel": "tr.add-synonym-panel"
    },

    events: {
        'input @ui.synonym_name': 'onSynonymNameInput',
        'click @ui.add_synonym': 'onAddSynonym',
        'click @ui.remove_synonym': 'onRemoveSynonym',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
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
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.synonym_name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
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
                url: application.baseUrl + 'taxonomy/search/',
                dataType: 'json',
                data: {filters: JSON.stringify(filters)},
                cache: false,
                el: this.ui.synonym_name,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (var i in data.items) {
                            var t = data.items[i];

                            if (t.value.toUpperCase() == this.el.val().toUpperCase()) {
                                $(this.el).validateField('failed', gt.gettext('Taxon name already in usage'));
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
        var type = $(this.ui.taxon_synonym_type).val();
        var name = $(this.ui.synonym_name).val();
        var language = $(this.ui.synonym_language).val();

        // @todo Is using a backbone plugin in way to manage nested models will be interesting,
        // to replace this manual ajax query and array in models ?
        // same for removeSynonym
        $.ajax({
            view: this,
            type: "PUT",
            url: application.baseUrl + 'taxonomy/' + this.model.id + "/",
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({type: type, name: name, language: language}),
            success: function(data) {
               this.view.model.addSynonym(type, name, language);
               this.view.render();
            }
        });
    },

    onRemoveSynonym: function (e) {
        var synonym = $(e.target.parentNode.parentNode);

        var type = synonym.find("[name='type']").attr('value');
        var name = synonym.find("[name='name']").text();
        var language = synonym.find("[name='language']").attr('value');

        $.ajax({
            view: this,
            type: "DELETE",
            url: application.baseUrl + 'taxonomy/' + this.model.id + "/",
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({type: type, name: name, language: language}),
            success: function(data) {
                this.view.model.removeSynonym(type, name, language);
                this.view.render();
            }
        });
    },
});

module.exports = TaxonItemView;
