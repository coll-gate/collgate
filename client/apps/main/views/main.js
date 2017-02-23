/**
 * @file mainlayout.js
 * @brief Main (root) layout with 3 columns
 * @author Frederic SCHERMA
 * @date 2017-01-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var MainLayout = Marionette.LayoutView.extend({
    template: require('../templates/main.html'),
    className: "column",

    regions: {
        'left': "div.root-left-bar",
        'content': "div.root-content",
        'right': "div.root-right-bar"
    },

    initialize: function() {
},

    onRender: function() {
        // application.setDisplay("2-8-2");
    },

    onBeforeShow: function() {
    },

    onBeforeDestroy: function () {
        // reset to default global display mode
        //application.setDisplay("2-8-2");
    }
});

module.exports = MainLayout;