/**
 * @file grcdetails.js
 * @brief GRC details item view
 * @author Frederic SCHERMA
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'object grc',
    template: require('../templates/grcdetails.html'),

    ui: {
    },

    events: {
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    }
});

module.exports = View;
