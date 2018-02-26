/**
 * @file valuelistcontext.js
 * @brief Value list context menu
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-02-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../main/templates/contextmenu.html'),
    className: "context value-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-value': {className: 'btn-default', label: _t('Create value')},
            }
        }
    },

    ui: {
        'create-value': 'button[name="create-value"]',
    },

    triggers: {
        "click @ui.create-value": "value:create",
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
