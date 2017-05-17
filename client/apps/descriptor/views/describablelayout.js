/**
 * @file describablelayout.js
 * @brief Three divs (rows) layout for describable entities
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-15-10
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var Layout = Marionette.LayoutView.extend({
    template: _.template('<div class="describable-header"></div><div class="describable-body"></div><div class="describable-footer"></div>'),
    attributes: {
    },

    regions: {
        'header': "div.describable-header",
        'body': "div.describable-body",
        'footer': "div.describable-footer"
    }
});

module.exports = Layout;
