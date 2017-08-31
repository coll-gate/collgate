/**
 * @file accession.js
 * @brief Accession item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'object accession element',
    attributes: function() {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require("../../descriptor/templates/entity.html"),

    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        details: 'td.view-accession-details',
        primary_classification_entry: 'td.view-primary-classification-entry-details'
    },

    events: {
        'click @ui.details': 'viewDetails',
        'click @ui.primary_classification_entry': 'viewPrimaryClassificationEntry'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                manage: {display: true, event: 'viewDetails'},
                remove: {display: true, event: 'onDeleteAccession'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        var properties = {
            manage: {disabled: false},
            remove: {disabled: false}
        };

        // @todo manage permissions

        if (/*!this.model.get('can_delete') ||*/0) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    onRender: function() {
    },

    viewDetails: function () {
        Backbone.history.navigate('app/accession/accession/' + this.model.get('id') + '/', {trigger: true});
    },

    viewPrimaryClassificationEntry: function () {
        Backbone.history.navigate('app/classification/classificationentry/' + this.model.get('primary_classification_entry') + '/', {trigger: true});
    },

    primaryClassificationEntryCell: function(td) {
        if (!this.model.get('primary_classification_entry_details')) {
            return
        }

        var classificationEntryName = this.model.get('primary_classification_entry_details').name || "";
        var classificationRank = this.model.get('primary_classification_entry_details').rank;

        var el = $('<span class="classification-entry classification-rank" title="">' + classificationEntryName + '</span>');
        if (classificationRank) {
            // @todo cache
            var rank = application.classification.collections.classificationRanks.findLabel(classificationRank);
            // var rank = application.main.cache.get('classification', classificationRank);

            el.attr('value', classificationRank);
            el.attr('title', rank);
        }

        td.html(el);
    },

    synonymCell: function(td) {
        var synonyms = this.model.get('synonyms');

        if (synonyms.length > 2) {
            var text = this.model.get('synonyms')[2].name;

            td.html(text);
        }
    },

    onDeleteAccession: function() {
        alert("@todo");
    }
});

module.exports = View;
