/**
 * @file batch.js
 * @brief Batch specialization for descriptor meta-model type.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorMetaModelType = require('../../descriptor/descriptormetamodeltypes/descriptormetamodeltype');

let Batch = DescriptorMetaModelType.extend({
    template: "<div></div>",

    onRender: function() {
    },

    getData: function() {
        return {}
    }
});

Batch.descriptorMetaModelTarget = 'accession.batch';

module.exports = Batch;
