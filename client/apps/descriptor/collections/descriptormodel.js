/**
 * @file descriptormodel.js
 * @brief Model of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorModelModel = require('../models/descriptormodel');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/model/',
    model: DescriptorModelModel,

    parse: function(data) {
        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;

        this.perms = data.perms;

        return data.items;
    },
});

module.exports = Collection;

