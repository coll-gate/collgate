/**
 * @file descriptorlistcontext.js
 * @brief  Descriptor list context menu
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-01-11
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../main/templates/contextmenu.html'),
    className: "context descriptor-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-descriptor': {className: 'btn-default', label: _t('Create descriptor')},
                'update-descriptor': {className: 'btn-success', label: _t('Update')}
            }
        }
    },

    ui: {
        'create-descriptor': 'button[name="create-descriptor"]',
        'update-descriptor': 'button[name="update-descriptor"]'
    },

    triggers: {
        "click @ui.create-descriptor": "descriptor:create",
        "click @ui.update-descriptor": "descriptor:update"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
