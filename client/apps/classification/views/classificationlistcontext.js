/**
 * @file classificationlistcontext.js
 * @brief Classification list context menu
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-20
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
                'add': {className: 'btn-success', label: _t('Create classification')},
            }
        }
    },

    ui: {
        'add': 'button[name="add"]'
    },

    triggers: {
        "click @ui.add": "classification:create"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
