/**
 * @file batchaction.js
 * @brief Batch action model view.
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2018-01-19
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'object batch-action element',
    attributes: function () {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require("../../../descriptor/templates/entity.html"),

    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        details: 'td.view-batch-action-details'
    },

    events: {
        'click @ui.details': 'viewDetails'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                manage: {display: true, event: 'viewDetails'},
                remove: {display: true, event: 'onDeleteBatchAction'}
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
        Backbone.history.navigate('app/accession/batchaction/' + this.model.get('id') + '/', {trigger: true});
    },

    onDeleteBatchAction: function () {
        alert("@todo");
    },

    accessionCell: function (td, value) {
        console.log(value)
        if (value && value.accession) {
            td.popupcell('init', {
                label: value.name,
                className: 'accession',
                type: 'entity',
                format: {
                    model: 'accession.accession',
                    details: true
                },
                value: value.id
            });
        }
    },

    batchActionTypeCell: function (td, value) {
        if (value && value.type) {
            /*td.popupcell('init', {
                label: value.name,
                className: 'batchaction',
                type: 'entity',
                format: {
                    model: 'accession.batchaction',
                    details: true
                },
                value: value.id
            });*/
        }
    }
});

module.exports = View;
