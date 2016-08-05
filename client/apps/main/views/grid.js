/**
 * @file grid.js
 * @brief Grid view based on layout.
 * @author Frederic SCHERMA
 * @date 2016-08-01
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
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
