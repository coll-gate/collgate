/**
 * @file describablelayout.js
 * @brief Three divs (rows) layout for describable entities
 * @author Frederic SCHERMA
 * @date 2016-15-10
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
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
