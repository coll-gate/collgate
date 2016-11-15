/**
 * @file descriptortype.js
 * @brief Types of descriptors collection
 * @author Frederic SCHERMA
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorTypeModel = require('../models/descriptortype');

var Collection = Backbone.Collection.extend({
    url: function() {
        return application.baseUrl + 'descriptor/group/' + this.group_id + '/type/';
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
