/**
 * @file batchdescriptorcontext.js
 * @brief Batch descriptors context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../templates/batchdescriptorcontext.html'),
    className: "context batch",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'modify': {className: 'btn-default', label: _t('Modify')},
                'apply': {className: 'btn-success', label: _t('Apply')},
                'cancel': {className: 'btn-default', label: _t('Cancel')}
            }
        }
    },

    ui: {
        'modify': 'button[name="modify"]',
        'apply': 'button[name="apply"]',
        'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.modify": "describable:modify",
        "click @ui.apply": "describable:apply",
        "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
