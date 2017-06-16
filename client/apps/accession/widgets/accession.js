/**
 * @file accession.js
 * @brief Display and manage an accession reference value format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescriptorFormatType = require('../../descriptor/widgets/descriptorformattype');
var Entity = require('../../descriptor/widgets/entity');

var Accession = function() {
    DescriptorFormatType.call(this);

    this.name = "accession";
    this.group = "single";
    this.searchUrl = "accession/accession/"
};

_.extend(Accession.prototype, Entity.prototype);

Accession.DescriptorTypeDetailsView = Entity.DescriptorTypeDetailsView;

module.exports = Accession;
