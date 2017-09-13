/**
 * @file descriptormetamodeltype.js
 * @brief Base class for any descriptor meta-model type widgets.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var DescriptorMetaModelType = Marionette.View.extend({
    className: 'descriptor-meta-model-type-details-data',
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

DescriptorMetaModelType.descriptorMetaModelTarget = null;

module.exports = DescriptorMetaModelType;
