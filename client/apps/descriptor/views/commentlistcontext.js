/**
 * @file commentlistcontext.js
 * @brief  Describable entity comment list context menu
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2018-06-26
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../main/templates/contextmenu.html'),
    className: "context comment-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'add': {className: 'btn-default', label: _t('Add')},
            }
        }
    },

    ui: {
        'add': 'button[name="add"]'
    },

    triggers: {
        "click @ui.add": "comment:add"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
