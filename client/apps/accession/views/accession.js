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
        parent: 'td.view-parent-details'
    },

    events: {
        'click @ui.details': 'viewDetails',
        'click @ui.parent': 'viewParent'
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

    viewParent: function () {
        Backbone.history.navigate('app/classification/taxon/' + this.model.get('parent') + '/', {trigger: true});
    },

    parentCell: function(td) {
        if (!this.model.get('parent_details')) {
            return
        }

        var parentName = this.model.get('parent_details').name || "";
        var parentRank = this.model.get('parent_details').rank;

        var el = $('<span class="parent taxon-rank" title="">' + parentName + '</span>');
        if (parentRank) {
            var rank = application.classification.collections.taxonRanks.findLabel(this.model.get('parent_details').rank);

            el.attr('value', this.model.get('parent_details').rank);
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
