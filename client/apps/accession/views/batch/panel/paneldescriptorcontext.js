/**
 * @file paneldescriptorcontext.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../../../main/templates/contextmenu.html'),
    className: "context-panel",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'modify': {className: 'btn-default', label: _t('Modify')},
                'apply': {className: 'btn-success', label: _t('Apply')},
                'cancel': {className: 'btn-default', label: _t('Cancel')},
                'add': {className: 'btn-success', label: _t('Defines')}
            }
        }
    },

    ui: {
        'modify': 'button[name="modify"]',
        'apply': 'button[name="apply"]',
        'cancel': 'button[name="cancel"]',
        'add': 'button[name="add"]'
    },

    triggers: {
        "click @ui.modify": "describable:modify",
        "click @ui.apply": "describable:apply",
        "click @ui.cancel": "describable:cancel",
        "click @ui.add": "descriptormetamodel:add"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
