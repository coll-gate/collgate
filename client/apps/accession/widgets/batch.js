/**
 * @file batch.js
 * @brief Display and manage a batch reference value format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
var Entity = require('../../descriptor/widgets/entity');

var Batch = function() {
    DescriptorFormatType.call(this);

    this.name = "batch";
    this.group = "single";
    this.searchUrl = "batch/batch/"
};

_.extend(Batch.prototype, Entity.prototype);

Batch.DescriptorTypeDetailsView = Entity.DescriptorTypeDetailsView;

module.exports = Batch;
