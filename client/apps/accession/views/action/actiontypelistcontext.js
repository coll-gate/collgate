/**
 * @file actiontypelistcontext.js
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
                'create-action-type': {className: 'btn-default', label: _t('Create a type of action')}
            }
        }
    },

    ui: {
        'create-action-type': 'button[name="create-action-type"]'
    },

    triggers: {
        "click @ui.create-action-type": "action-type:create"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
