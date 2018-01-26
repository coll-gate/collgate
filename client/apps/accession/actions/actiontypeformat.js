/**
 * @file actiontypeformat.js
 * @brief Base class for any action type format.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let ActionTypeFormat = function() {
    this.name = "";         // format name
    this.group = "";        // related informal group name
};

ActionTypeFormat.prototype = {
};

ActionTypeFormat.ActionTypeFormatDetailsView = Marionette.View.extend({
    className: 'action-format-details',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    getFormat: function() {
        return {
        }
    }
});

module.exports = ActionTypeFormat;
