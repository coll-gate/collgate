/**
 * @file accessiondetails.js
 * @brief Accession details item view
 * @author Frederic SCHERMA
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    className: 'object accession',
    template: "<div>@todo</div>",  // require('../../descriptor/templates/describabledetails.html'),

    ui: {
    },

    events: {
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    }
});

module.exports = View;
