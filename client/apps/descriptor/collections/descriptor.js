/**
 * @file descriptor.js
 * @brief Descriptor collection
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-01-10
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorModel = require('../models/descriptor');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['descriptor', 'descriptor']);
    },
    model: DescriptorModel
});

module.exports = Collection;