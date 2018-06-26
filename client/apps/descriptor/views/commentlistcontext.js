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
                'modify': {className: 'btn-default', label: _t('Modify')},
                'apply': {className: 'btn-success', label: _t('Apply')},
                'cancel': {className: 'btn-default', label: _t('Cancel')},
            }
        }
    },

    ui: {
        'add': 'button[name="add"]',
        'modify': 'button[name="modify"]',
        'apply': 'button[name="apply"]',
        'cancel': 'button[name="cancel"]'
    },

    triggers: {
        "click @ui.add": "comment:add",
        "click @ui.modify": "comment:modify",
        "click @ui.apply": "comment:apply",
        "click @ui.cancel": "comment:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
