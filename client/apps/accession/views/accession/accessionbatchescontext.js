/**
 * @file accessionbatchescontext.js
 * @brief Accession batches context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-04-26
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../../main/templates/contextmenu.html'),
    className: "context accession-batches",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create': {className: 'btn-default', label: _t('Introduce a batch')},
                //'apply': {className: 'btn-success', label: _t('Apply')},
                //'cancel': {className: 'btn-default', label: _t('...')}
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
