/**
 * @file descriptortype.js
 * @brief Types of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorTypeModel = require('../models/descriptortype');

var Collection = Backbone.Collection.extend({
    url: function() {
        return window.application.url(['descriptor', 'group', this.group_id, 'type']);
    },

    model: DescriptorTypeModel,

    initialize: function(models, options) {
        options || (options = {});
        this.group_id = options.group_id;
    },

    parse: function(data) {
        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;

        return data.items;
    },
});

module.exports = Collection;

