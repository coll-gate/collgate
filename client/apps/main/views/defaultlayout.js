/**
 * @file defaultlayout.js
 * @brief Default layout with one Bootstrap panel
 * @author Frederic SCHERMA
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var DefaultLayout = Marionette.LayoutView.extend({
    template: "#layout_view",

    regions: {
        title: ".panel-title",
        content: ".panel-body",
    },

    initialize: function() {
    },

    onRender: function() {
    },

    onBeforeShow: function() {
    },
});

module.exports = DefaultLayout;
