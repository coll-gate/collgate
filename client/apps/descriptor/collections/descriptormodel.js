/**
 * @file descriptormodel.js
 * @brief Model of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let DescriptorModelModel = require('../models/descriptormodel');

let Collection = CountableCollection.extend({
    url: window.application.url(['descriptor', 'model']),
    model: DescriptorModelModel
});

module.exports = Collection;
