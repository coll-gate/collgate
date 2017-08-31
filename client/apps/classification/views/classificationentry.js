/**
 * @file classificationentry.js
 * @brief Classification entry item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var ClassificationEntryView = Marionette.View.extend({
    tagName: 'tr',
    className: 'object classification-entry element',
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
        "classification_entry": "td.view-classification-entry-details",
        "remove_classification_entry": ".remove-classification-entry",
        "synonym_name": ".synonym-name",
        "synonym_language": ".synonym-languages",
        "classification_entry_synonym_type": ".classification-entry-synonym-types",
        "classification_rank": ".classification-rank",
        "parent": ".parent"
    },

    events: {
        "click @ui.classification_entry": "onClassificationEntryDetails",
        "click @ui.parent": "onParentClassificationEntryDetails",
        "click @ui.remove_classification_entry": "onRemoveClassificationEntry"
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                manage: {display: true, event: 'onClassificationEntryDetails'},
                remove: {display: true, event: 'onRemoveClassificationEntry'}
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
        application.main.views.languages.htmlFromValue(this.el);
        // application.classification.views.classificationEntrySynonymTypes.htmlFromValue(this.el);
    },

    onClassificationEntryDetails: function() {
        Backbone.history.navigate("app/classification/classificationentry/" + this.model.get('id') + "/", {trigger: true});
    },

    onParentClassificationEntryDetails: function() {
        if (this.model.get('parent')) {
            Backbone.history.navigate("app/classification/classificationentry/" + this.model.get('parent') + "/", {trigger: true});
        }
    },

    onRemoveClassificationEntry: function() {
        this.model.destroy({wait: true}).then(function() {
            $.alert.success(gt.gettext("Successfully removed !"));
        });
    },

    rankCell: function(td) {
        var rank = this.model.get('rank');

        // @todo how to manage multiple classifications, main.cache ?
        var text = application.classification.collections.classificationRanks.findLabel(rank);

        td.html(text);
    },

    parentCell: function(td) {
        if (this.model.get('parent_details')) {
            var parent_name = this.model.get('parent_details').name || "";
            var parent_rank = this.model.get('parent_details').rank;

            var el = $('<span class="parent classification-rank" title="">' + parent_name + '</span>');
            if (parent_rank) {
                var rank = application.classification.collections.classificationRanks.findLabel(this.model.get('parent_details').rank);

                el.attr('value', this.model.get('parent_details').rank);
                el.attr('title', rank);
            }

            td.html(el);
        }
    },

    synonymCell: function(td) {
        var synonyms = this.model.get('synonyms');

        if (synonyms.length > 1) {
            var text = this.model.get('synonyms')[1].name;

            td.html(text);
        }
    }
});

module.exports = ClassificationEntryView;
