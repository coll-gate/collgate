/**
 * @file descriptormetamodel.js
 * @brief Meta-model of descriptors collection
 * @author Frederic SCHERMA
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorMetaModelModel = require('../models/descriptormetamodel');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/meta-model/',
    model: DescriptorMetaModelModel,

    parse: function(data) {
        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;

        this.perms = data.perms;

        return data.items;
    },
});

module.exports = Collection;
