/**
 * @file index.js
 * @brief Help index view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    tagName: 'div',
    className: 'help-index',
    template: require('../../templates/help/index.html'),

    ui: {
    },

    events: {
    },

    initialize: function() {
    },

    onRender: function() {
    }
});

module.exports = View;

