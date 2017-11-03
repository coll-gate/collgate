/**
 * @file index.js
 * @brief Help index view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
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
