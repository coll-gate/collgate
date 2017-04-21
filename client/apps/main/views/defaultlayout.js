/**
 * @file defaultlayout.js
 * @brief Default layout with one Bootstrap panel
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var DefaultLayout = Marionette.LayoutView.extend({
    template: require("../templates/defaultlayout.html"),
    attributes: {
        style: "height: 100%;"
    },

    regions: {
        'title': ".panel-title",
        'content': ".panel-body",
        'content-bottom': ".panel-body-bottom",
        'bottom': ".panel-bottom"
    },

    onBeforeDestroy: function () {
        // reset to default global display mode
        //application.setDisplay("2-8-2");
    }
});

module.exports = DefaultLayout;

