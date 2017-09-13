/**
 * @file batch.js
 * @brief Batch specialization for descriptor meta-model type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescriptorMetaModelType = require('../../descriptor/descriptormetamodeltypes/descriptormetamodeltype');

var Batch = DescriptorMetaModelType.extend({
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

Batch.descriptorMetaModelTarget = 'accession.batch';

module.exports = Batch;
