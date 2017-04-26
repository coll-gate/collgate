/**
 * @file accessionbatchescontext.js
 * @brief Accession batches context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-04-26
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    tagName: 'div',
    template: require('../templates/accessionbatchescontext.html'),
    className: "context accession-batches",
    templateHelpers/*templateContext*/: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create': {className: 'btn-default', label: gt.gettext('Introduce a batch')},
                //'apply': {className: 'btn-success', label: gt.gettext('Apply')},
                //'cancel': {className: 'btn-default', label: gt.gettext('...')}
            }
        }
    },

    ui: {
        'create': 'button[name="create"]',
        //'apply': 'button[name="apply"]',
        //'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.create": "batch:create",
        //"click @ui.apply": "describable:apply",
        //"click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
