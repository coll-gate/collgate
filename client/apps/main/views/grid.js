/**
 * @file grid.js
 * @brief Grid view based on layout.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-08-01
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    template: '<thead name="grid-column"></thead><tbody name="grid-row"></tbody><tfoot name="grid-footer"></tfoot>',
    attributes: {
        style: "height: 100%;"
    },

    regions: {
        head: 'thead[name="grid-column"]',
        body: 'tbody[name="grid-row"]',
        foot: 'tfoot[name="grid-footer"]',
    },

    initialize: function() {
    },

    onRender: function() {
    }
});

module.exports = View;
