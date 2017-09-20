/**
 * @file accessionpaneldescriptorcontext.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-15
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/accesisonpaneldescriptorcontext.html'),
    className: "context-panel",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'modify': {className: 'btn-default', label: gt.gettext('Modify')},
                'apply': {className: 'btn-success', label: gt.gettext('Apply')},
                'cancel': {className: 'btn-default', label: gt.gettext('Cancel')},
                'add': {className: 'btn-success', label: gt.gettext('Defines')}
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
