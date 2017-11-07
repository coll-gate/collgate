/**
 * @file accession.js
 * @brief Accession element view from
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-10-02
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'object accession element',
    attributes: function () {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require("../../../../descriptor/templates/entity.html"),

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
            behaviorClass: require('../../../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                manage: {display: true, event: 'viewDetails'},
                remove: {display: true, event: 'onDeleteAccession'},
                unlink: {display: true, event: 'onUnlinkAccession'}
            }
        }
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function () {
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

    onRender: function () {
    },

    viewDetails: function () {
        Backbone.history.navigate('app/accession/accession/' + this.model.get('id') + '/', {trigger: true});
    },

    viewPrimaryClassificationEntry: function () {
        Backbone.history.navigate('app/classification/classificationentry/' + this.model.get('primary_classification_entry') + '/', {trigger: true});
    },

    synonymCell: function (td) {
        let synonyms = this.model.get('synonyms');

        // @todo which one ?
        if (synonyms.length > 2) {
            let text = this.model.get('synonyms')[2].name;

            td.html(text);
        }
    },

    onDeleteAccession: function () {
        alert("@todo");
    },

    onUnlinkAccession: function () {
        let view = this;
        $.ajax({
            type: 'PATCH',
            url: window.application.url(['accession', 'accessionpanel', view.model.collection.panel_id, 'accessions']),
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                'action': 'remove',
                'selection': {
                    'select': {
                        "op": 'in',
                        "term": 'id',
                        "value": [view.model.id]
                    },
                    'from': {
                        'content_type': 'accession.accessionpanel',
                        'id': view.model.collection.panel_id
                    }
                }
            })
        }).done(function () {
            view.model.collection.count();
            view.model.collection.remove(view.model);
        });
    },

    primaryClassificationEntryCell: function (td, value) {
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
});

module.exports = View;
