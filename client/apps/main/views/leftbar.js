/**
 * @file leftbar.js
 * @brief Default left bar view.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    template: require('../templates/leftbar.html'),

    initialize: function(options) {
    },

    onRender: function() {
    }
});

module.exports = View;
