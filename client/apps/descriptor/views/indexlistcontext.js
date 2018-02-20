/**
 * @file indexlistcontext.js
 * @brief index list context menu
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-02-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../main/templates/contextmenu.html'),
    className: "context index-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-index': {className: 'btn-default', label: _t('Create index')},
                // 'update-descriptor': {className: 'btn-success', label: _t('Update')},
                // 'apply-descriptor': {className: 'btn-success', label: _t('Apply')},
                // 'cancel-descriptor': {className: 'btn-default', label: _t('Cancel')}
            }
        }
    },

    ui: {
        'create-index': 'button[name="create-index"]',
        // 'update-descriptor': 'button[name="update-descriptor"]',
        // 'apply-descriptor': 'button[name="apply-descriptor"]',
        // 'cancel-descriptor': 'button[name="cancel-descriptor"]'
    },

    triggers: {
        "click @ui.create-index": "index:create",
        // "click @ui.update-descriptor": "descriptor:update",
        // "click @ui.apply-descriptor": "descriptor:apply",
        // "click @ui.cancel-descriptor": "descriptor:cancel"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;