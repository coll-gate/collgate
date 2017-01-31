/**
 * @file rightbar.js
 * @brief Default right bar view.
 * @author Frederic SCHERMA
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    className: "objects events",
    template: require('../templates/rightbar.html'),

    initialize: function(options) {
    },

    onRender: function() {
    }
});

module.exports = View;
