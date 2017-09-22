/**
 * @file accessionlistcontext.js
 * @brief Accession list context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-08
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/accessionlistcontext.html'),
    className: "context accession-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-panel': {className: 'btn-default', label: _t('Create panel')},
                // 'xxx': {className: 'btn-success', label: _t('XXxx')},
                // 'yyy': {className: 'btn-default', label: _t('YYyy')}
            }
        }
    },

    ui: {
        'create-panel': 'button[name="create-panel"]',
        // 'apply': 'button[name="apply"]',
        // 'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.create-panel": "panel:create",
        // "click @ui.apply": "describable:apply",
        // "click @ui.cancel": "describable:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
