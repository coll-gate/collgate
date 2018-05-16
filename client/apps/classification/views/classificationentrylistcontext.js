/**
 * @file classificationentrylistcontext.js
 * @brief Classification entry list context menu
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2018-05-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../main/templates/contextmenu.html'),
    className: "context classification-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'export-list': {className: 'btn-success', label: _t('Export as...')},
                'import-list': {className: 'btn-success', label: _t('Import from...')}
            }
        }
    },

    ui: {
        'export-list': 'button[name="export-list"]',
        'import-list': 'button[name="import-list"]'
    },

    triggers: {
        "click @ui.export": "classifications:export-list",
        "click @ui.import": "classifications:import-list"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
