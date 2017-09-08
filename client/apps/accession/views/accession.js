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
        primary_classification_entry: 'td.view-primary-classification-entry-details',
        primary_classification_rank: 'td[name=primary_classification_entry] span.classification-rank',
        accession_select: 'td.accession-select span',
    },

    events: {
        'click @ui.details': 'viewDetails',
        'click @ui.primary_classification_entry': 'viewPrimaryClassificationEntry',
        'click @ui.accession_select': 'onSelectAccession',
        'mouseover @ui.primary_classification_rank': 'onOverPrimaryClassification'
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

    synonymCell: function(td) {
        var synonyms = this.model.get('synonyms');

        if (synonyms.length > 2) {
            var text = this.model.get('synonyms')[2].name;

            td.html(text);
        }
    },

    onDeleteAccession: function() {
        alert("@todo");
    },

    onSelectAccession: function() {
        // @todo
    },

    primaryClassificationEntryCell: function(td, value) {
        if (value && value.rank) {
            // @todo an helper and for onOverParent...
            var el = $('<span class="classification-rank popover-dismiss" data-toggle="popover" data-placement="bottom" data-container="body" data-content="">' + value.name + '</span>');
            el.attr('rank', value.rank);
            td.html(el);
        }
    },

    onOverPrimaryClassification: function(e) {
        // init the popover on the first mouse hover
        var el = $(e.target);
        var parentRank = parseInt(el.attr('rank'));

        if (Number.isInteger(parentRank) && el.attr('data-content') === "") {
            application.main.cache.lookup({type: 'entity', format: {model: 'classification.classificationrank', 'details': true}}, [parentRank]).done(function (data) {
                el.attr('data-content', data[parentRank].value.label);
                el.popover({'trigger': 'hover'});

                // manually show it if still hover once data is synced
                if (el.is(':hover')) {
                    el.popover('show');
                }
            });
        }
    }
});

module.exports = View;
