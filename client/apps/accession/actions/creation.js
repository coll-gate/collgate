/**
 * @file creation.js
 * @brief Display and manage a creation format of type of batch-action
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchActionFormatType = require('./batchactiontypeformat');
let Marionette = require('backbone.marionette');

let CreationFormat = function() {
    BatchActionFormatType.call(this);

    this.name = "creation";
    this.group = "single";
};

_.extend(CreationFormat.prototype, BatchActionFormatType.prototype, {

});

CreationFormat.BatchActionTypeFormatDetailsView = Marionette.View.extend({
    className: 'batchactiontype-format-details-format',
    template: require('../templates/actions/creation.html'),

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

CreationFormat.format = function(value) {
    if (value === null || value === undefined) {
        return "";
    } else {
        return value === true ? _t("Yes") : _t("No");
    }
};

module.exports = CreationFormat;
