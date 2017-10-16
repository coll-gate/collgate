/**
 * @file classificationentry.js
 * @brief Classification entry item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let ClassificationEntryView = Marionette.View.extend({
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
        "parent_details": ".view-parent-details"
    },

    events: {
        "click @ui.classification_entry": "onClassificationEntryDetails",
        "click @ui.parent_details": "onParentClassificationEntryDetails",
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
        let properties = {
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
            $.alert.success(_t("Successfully removed !"));
        });
    },

    rankCell: function(td, value) {
        if (value && value.label) {
            let text = value.label;
            td.html(text);
        }
    },

    synonymCell: function(td) {
        let synonyms = this.model.get('synonyms');

        if (synonyms.length > 1) {
            let text = this.model.get('synonyms')[1].name;
            td.html(text);
        }
    },

    parentCell: function(td, value) {
        if (value && value.rank) {
            if (value && value.rank) {
                td.popupcell('init', {
                    label: value.name,
                    className: 'classification-rank',
                    type: 'entity',
                    format: {
                        model: 'classification.classificationrank',
                        details: true
                    },
                    value: value.rank
                });
            }
        }
    }
});

module.exports = ClassificationEntryView;
