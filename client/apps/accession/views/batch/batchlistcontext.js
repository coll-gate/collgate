/**
 * @file batchlistcontext.js
 * @brief Batch list context menu
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-06
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../../main/templates/contextmenu.html'),
    className: "context batch-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create': {className: 'btn-default', label: _t('Introduce a batch')},
                'create-panel': {className: 'btn-default', label: _t('Create new panel')},
                'link-to-panel': {className: 'btn-default', label: _t('Link to existing panel')},
                'unlink-batches': {className: 'btn-danger', label: _t('Unlink batches')}
            }
        }
    },

    ui: {
        'create': 'button[name="create"]',
        'create-panel': 'button[name="create-panel"]',
        'link-to-panel': 'button[name="link-to-panel"]',
        'unlink-batches': 'button[name="unlink-batches"]'
    },

    triggers: {
        "click @ui.create": "batch:create",
        "click @ui.create-panel": "panel:create",
        "click @ui.link-to-panel": "panel:link-batches",
        "click @ui.unlink-batches": "batches:unlink"
    },

    initialize: function (options) {
        options || (options = {actions: []});
    }
});

module.exports = View;