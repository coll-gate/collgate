/**
 * @file batchactionformattype.js
 * @brief Base class for any batch action format type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let BatchActionFormatType = function() {
    this.name = "";         // format type name
    this.group = "";        // related informal group name
};

BatchActionFormatType.prototype = {
};

BatchActionFormatType.BatchActionTypeDetailsView = Marionette.View.extend({
    className: 'batchaction-type-details-format',
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

module.exports = BatchActionFormatType;
