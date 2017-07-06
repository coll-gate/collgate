/**
 * @file batch.js
 * @brief Batch item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'object batch element',
    attributes: function() {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require('../templates/batch.html'),

    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                manage: {display: true, event: 'viewDetails'},
                remove: {display: true, event: 'onDeleteBatch'}
            }
        }
    },

    ui: {
        details: 'td.view-batch-details',
        accession: 'td.view-accession-details'
    },

    events: {
        'click @ui.details': 'viewDetails',
        'click @ui.accession': 'viewAccession'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    viewDetails: function () {
        Backbone.history.navigate('app/accession/batch/' + this.model.get('id') + '/', {trigger: true});
    },

    viewAccession: function () {
        Backbone.history.navigate('app/accession/accession/' + this.model.get('accession') + '/', {trigger: true});
    },

    onDeleteBatch: function() {
        // @todo remove? or may be archives?
        alert("@todo");
    },

    selectBatch: function () {
        // @todo
        alert("not yet implemented !");
    }
});

module.exports = View;
