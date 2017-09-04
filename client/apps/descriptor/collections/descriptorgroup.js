/**
 * @file descriptorgroup.js
 * @brief Groups of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var CountableCollection = require('../../main/collections/countable');
var DescriptorGroupModel = require('../models/descriptorgroup');

var Collection = CountableCollection.extend({
    url: application.baseUrl + 'descriptor/group/',
    model: DescriptorGroupModel,

    comparator: function (item1, item2) {
        var item1Name = item1.get('name');
        var item2Name = item2.get('name');

        return item1Name.localeCompare(item2Name /*, locale*/);
    }
});

module.exports = Collection;
