/**
 * @file taxonview.js
 * @brief Taxon list view
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
    template: require('../templates/taxon.html'),

    ui: {
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "synonym_type": ".synonym-types",
        "taxon_rank": ".taxon-ranks",
        "editmode": ".edit-mode",
        "add_synonym": ".add-synonym",
        "remove_synonym": ".remove-synonym",
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
        ohgr.main.views.languages.drawSelect(this.ui.synonym_language);
        ohgr.main.views.synonymTypes.drawSelect(this.ui.synonym_type);
        ohgr.taxonomy.views.taxonRanks.drawSelect(this.ui.taxon_rank);
        
        ohgr.main.views.languages.htmlFromValue(this.el);
        ohgr.main.views.synonymTypes.htmlFromValue(this.el);
        ohgr.taxonomy.views.taxonRanks.htmlFromValue(this.el);

        this.ui.synonym_type.find('option[value="0"]').remove();
        $(this.ui.synonym_type).selectpicker('refresh');
    },

    validateName: function() {
        var v = this.ui.synonym_name.val();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            validateInput(this.ui.synonym_name, 'failed', gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            validateInput(this.ui.synonym_name, 'failed', gettext('3 characters min'));
            return false;
        }

        return true;
    },

    onSynonymNameInput: function () {
        if (this.validateName()) {
            $.ajax({
                type: "GET",
                url: ohgr.baseUrl + 'taxonomy/search/',
                dataType: 'json',
                data: {term: this.ui.synonym_name.val(), type: "name", mode: "ieq"},
                el: this.ui.synonym_name,
                success: function(data) {
                    if (data.length > 0) {
                        for (var i in data) {
                            var t = data[i];

                            if (t.value.toUpperCase() == this.el.val().toUpperCase()) {
                                validateInput(this.el, 'failed', gettext('Taxon name already in usage'));
                                break;
                            }
                        }
                    } else {
                        validateInput(this.el, 'ok');
                    }
                }
            });
        }
    },

    onAddSynonym: function () {
        var type = $(this.ui.synonym_type).val();
        var name = $(this.ui.synonym_name).val();
        var language = $(this.ui.synonym_language).val();

        // HOW TODO that using backbones model
        $.ajax({
            view: this,
            type: "PUT",
            url: ohgr.baseUrl + 'taxonomy/' + this.model.id + "/",
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({type: type, name: name, language: language}),
            success: function(data) {
               if (data.result == "success") {
                   this.view.model.addSynonym(type, name, language);
                   this.view.render();
               }
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
            url: ohgr.baseUrl + 'taxonomy/' + this.model.id + "/",
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({type: type, name: name, language: language}),
            success: function(data) {
                if (data.result == "success") {
                    this.view.model.removeSynonym(type, name, language);
                    this.view.render();
                }
            }
        });
    },
});

module.exports = TaxonItemView;
