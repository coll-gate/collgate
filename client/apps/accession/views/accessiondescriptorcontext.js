/**
 * @file accessiondescriptorcontext.js
 * @brief Accession descriptors context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    tagName: 'div',
    template: require('../templates/accessiondescriptorcontext.html'),
    className: "context accession",
    templateHelpers/*templateContext*/: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'modify': {className: 'btn-default', label: gt.gettext('Modify')},
                'apply': {className: 'btn-success', label: gt.gettext('Apply')},
                'cancel': {className: 'btn-default', label: gt.gettext('Cancel')}
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

