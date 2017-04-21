/**
 * @file descriptorgroup.js
 * @brief Groups of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorGroupModel = require('../models/descriptorgroup');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/group/',
    model: DescriptorGroupModel,

    parse: function(data) {
        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;

        return data.items;
    },
});

module.exports = Collection;

