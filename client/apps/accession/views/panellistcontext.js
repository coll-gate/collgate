/**
 * @file panellistcontext.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-10-03
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/panellistcontext.html'),
    className: "context-panellist",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'union': {className: 'btn-default', label: _t('Union')},
                'intersection': {className: 'btn-default', label: _t('Intersection')},
                'difference': {className: 'btn-default', label: _t('Difference')}
            }
        }
    },

    ui: {
        'union': 'button[name="union"]',
        'intersection': 'button[name="intersection"]',
        'difference': 'button[name="difference"]'
    },

    triggers: {
        "click @ui.union": "panel:union",
        "click @ui.intersection": "panel:intersection",
        "click @ui.difference": "panel:difference"
    },

    initialize: function(options) {
        options || (options = {actions: []});
    }
});

module.exports = View;