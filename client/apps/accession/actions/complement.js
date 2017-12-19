/**
 * @file complement.js
 * @brief Display and manage a complement format of type of batch-action
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-19
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchActionFormatType = require('./batchactiontypeformat');
let Marionette = require('backbone.marionette');

let Format = function() {
    BatchActionFormatType.call(this);

    this.name = "complement";
    this.group = "standard";
};

_.extend(Format.prototype, BatchActionFormatType.prototype, {

});

Format.BatchActionTypeFormatDetailsView = Marionette.View.extend({
    className: 'batchactiontype-format-details-format',
    template: require('../templates/actions/complement.html'),

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
