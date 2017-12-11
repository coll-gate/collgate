/**
 * @file creation.js
 * @brief Display and manage a creation format of type of batch-action
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchActionFormatType = require('./batchactionformattype');
let Marionette = require('backbone.marionette');

let CreationType = function() {
    BatchActionFormatType.call(this);

    this.name = "creation";
    this.group = "single";
};

_.extend(CreationType.prototype, BatchActionFormatType.prototype, {

});

CreationType.DescriptorTypeDetailsView = Marionette.View.extend({
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

CreationType.format = function(value) {
    if (value === null || value === undefined) {
        return "";
    } else {
        return value === true ? _t("Yes") : _t("No");
    }
};

module.exports = CreationType;
