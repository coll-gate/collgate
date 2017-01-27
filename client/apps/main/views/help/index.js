/**
 * @file index.js
 * @brief Help index view
 * @author Frederic SCHERMA
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
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
