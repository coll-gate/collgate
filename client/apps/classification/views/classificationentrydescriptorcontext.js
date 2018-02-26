/**
 * @file classificationentrydescriptorcontext.js
 * @brief Classification entry descriptor context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-30
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../main/templates/contextmenu.html'),
    className: "context classification-entry",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                // 'add': {className: 'btn-success', label: _t('Defines')},
                'modify': {className: 'btn-default', label: _t('Modify')},
                // 'replace': {className: 'btn-default', label: _t('Replace all')},
                // 'delete': {className: 'btn-danger', label: _t('Delete all')},
                'apply': {className: 'btn-success', label: _t('Apply')},
                'cancel': {className: 'btn-default', label: _t('Cancel')}
            }
        }
    },

    ui: {
        // 'add': 'button[name="add"]',
        'modify': 'button[name="modify"]',
        // 'replace': 'button[name="replace"]',
        // 'delete': 'button[name="delete"]',
        'apply': 'button[name="apply"]',
        'cancel': 'button[name="cancel"]'
    },

    triggers: {
        // "click @ui.add": "layout:add",
        // "click @ui.replace": "layout:replace",
        // "click @ui.delete": "layout:delete",
        "click @ui.modify": "describable:modify",
        "click @ui.apply": "describable:apply",
        "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
