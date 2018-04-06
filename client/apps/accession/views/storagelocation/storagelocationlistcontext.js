/**
 * @file storagelocationlistcontext.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-04-04
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../../main/templates/contextmenu.html'),
    className: "context storageLocation-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-storageLocation': {className: 'btn-default', label: _t('Create new storage location')}
            }
        }
    },

    ui: {
        'create-storageLocation': 'button[name="create-storageLocation"]'
    },

    triggers: {
        "click @ui.create-storageLocation": "storageLocation:create"
    },

    initialize: function (options) {
        options || (options = {actions: []});
    }
});

module.exports = View;
