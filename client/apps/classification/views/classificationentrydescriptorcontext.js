/**
 * @file classificationentrydescriptorcontext.js
 * @brief Classification entry descriptor context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-30
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/classificationentrydescriptorcontext.html'),
    className: "context classification-entry",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'add': {className: 'btn-success', label: gt.gettext('Defines')},
                'modify': {className: 'btn-default', label: gt.gettext('Modify')},
                'replace': {className: 'btn-default', label: gt.gettext('Replace all')},
                'delete': {className: 'btn-danger', label: gt.gettext('Delete all')},
                'apply': {className: 'btn-success', label: gt.gettext('Apply')},
                'cancel': {className: 'btn-default', label: gt.gettext('Cancel')}
            }
        }
    },

    ui: {
        'add': 'button[name="add"]',
        'modify': 'button[name="modify"]',
        'replace': 'button[name="replace"]',
        'delete': 'button[name="delete"]',
        'apply': 'button[name="apply"]',
        'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.add": "descriptormetamodel:add",
        "click @ui.replace": "descriptormetamodel:replace",
        "click @ui.delete": "descriptormetamodel:delete",
        "click @ui.modify": "describable:modify",
        "click @ui.apply": "describable:apply",
        "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
