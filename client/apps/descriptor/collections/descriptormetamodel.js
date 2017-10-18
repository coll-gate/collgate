/**
 * @file descriptormetamodel.js
 * @brief Meta-model of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let DescriptorMetaModelModel = require('../models/descriptormetamodel');

let Collection = CountableCollection.extend({
    url: window.application.url(['descriptor', 'meta-model']),
    model: DescriptorMetaModelModel,
});

module.exports = Collection;
