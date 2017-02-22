/**
 * @file contentbottom.js
 * @brief Two rows content+bottom layout
 * @author Frederic SCHERMA
 * @date 2017-02-01
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.LayoutView.extend({
    template: require("../templates/contentbottomlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'content': "div.content",
        'bottom': "div.layout-bottom",
    }
});

module.exports = View;
