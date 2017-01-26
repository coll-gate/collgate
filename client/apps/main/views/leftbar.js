/**
 * @file leftbar.js
 * @brief Default left bar view.
 * @author Frederic SCHERMA
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    template: require('../templates/leftbar.html'),

    initialize: function(options) {
    },

    onRender: function() {
    }
});

module.exports = View;
