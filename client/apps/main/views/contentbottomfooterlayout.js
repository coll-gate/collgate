/**
 * @file contentbottomfooterlayout.js
 * @brief Two rows content+bottom+footer layout
 * @author Frederic SCHERMA
 * @date 2017-03-31
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    template: require("../templates/contentbottomfooterlayout.html"),

    attributes: {
        style: "height: 100%; display: flex; flex-direction: column;"
    },

    regions: {
        'content': "div.content",
        'bottom': "div.layout-bottom",
        'footer': "div.layout-footer"
    }
});

module.exports = View;
