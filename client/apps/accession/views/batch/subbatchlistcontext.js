/**
 * @file subbatchlistcontext.js
 * @brief Sub-batch list context menu
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
    className: "context batch",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create': {className: 'btn-default', label: _t('Introduce a sub-batch')},
                'unlink': {className: 'btn-danger', label: _t('Unlink sub-batches')}
            }
        }
    },

    ui: {
        'create': 'button[name="create"]',
        'unlink': 'button[name="unlink"]'
    },

    triggers: {
        "click @ui.create": "batch:create",
        "click @ui.unlink": "batch:unlink"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
