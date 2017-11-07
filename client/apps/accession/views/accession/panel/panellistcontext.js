/**
 * @file panellistcontext.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-10-03
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../../templates/panellistcontext.html'),
    className: "context-panellist",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-panel': {className: 'btn-default', label: _t('Create new panel')},
                'union': {className: 'btn-default', label: _t('Union')},
                'intersection': {className: 'btn-default', label: _t('Intersection')}
            }
        }
    },

    ui: {
        'create-panel': 'button[name="create-panel"]',
        'union': 'button[name="union"]',
        'intersection': 'button[name="intersection"]'
    },

    triggers: {
        "click @ui.create-panel": "panel:create",
        "click @ui.union": "panel:union",
        "click @ui.intersection": "panel:intersection"
    },

    initialize: function (options) {
        options || (options = {actions: []});
    }
});

module.exports = View;