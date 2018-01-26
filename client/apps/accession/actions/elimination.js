/**
 * @file elimination.js
 * @brief Display and manage an elimination test format of type of action
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-19
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionFormatType = require('./actiontypeformat');
let Marionette = require('backbone.marionette');

let Format = function() {
    ActionFormatType.call(this);

    this.name = "elimination";
    this.group = "standard";
};

_.extend(Format.prototype, ActionFormatType.prototype, {

});

Format.ActionTypeFormatDetailsView = Marionette.View.extend({
    className: 'action-format-details-format',
    template: require('../templates/actions/elimination.html'),

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        let format = this.model.get('format');
    },

    getFormat: function() {
        return {
        }
    }
});

module.exports = Format;
