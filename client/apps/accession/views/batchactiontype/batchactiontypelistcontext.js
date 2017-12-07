/**
 * @file batchactiontypelistcontext.js
 * @brief Accession list context menu
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2017-12-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../../main/templates/contextmenu.html'),
    className: "context accession-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-batch-action-type': {className: 'btn-default', label: _t('Create type of action')},
                // 'xxx': {className: 'btn-success', label: _t('XXxx')},
                // 'yyy': {className: 'btn-default', label: _t('YYyy')}
            }
        }
    },

    ui: {
        'create-batch-action-type': 'button[name="create-batch-action-type"]',
        // 'apply': 'button[name="apply"]',
        // 'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.create-batch-action-type": "batch-action-type:create",
        // "click @ui.apply": "describable:apply",
        // "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
