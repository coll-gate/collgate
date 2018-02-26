/**
 * @file layouttype.js
 * @brief Base class for any descriptor layout type widgets.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let LayoutType = Marionette.View.extend({
    className: 'layout-type-details-data',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    getData: function() {
        return {}
    }
});

LayoutType.layoutTarget = null;

module.exports = LayoutType;
