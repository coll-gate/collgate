/**
 * @file descriptormodel.js
 * @brief Model of descriptors collection
 * @author Frederic SCHERMA
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorModelModel = require('../models/descriptormodel');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'accession/descriptor/model/',
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
