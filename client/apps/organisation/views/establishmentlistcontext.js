/**
 * @file establishmentlistcontext.js
 * @brief Establishment list for organisation context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-10-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/establishmentlistcontext.html'),
    className: "context establishment-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'add': {className: 'btn-default', label: _t('Add establishment')}
            }
        }
    },

    ui: {
        'add': 'button[name="add"]'
    },

    triggers: {
        "click @ui.add": "establishment:add"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
