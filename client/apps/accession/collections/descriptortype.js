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
        return application.baseUrl + 'accession/descriptor/group/' + this.group_id + '/type/';
    },

    model: DescriptorTypeModel,

    initialize: function(models, options) {
        options || (options = {});
        this.group_id = options.group_id;
    },

    parse: function(data) {
        this.page = data.page;
        this.total_count = data.total_count;

        return data.items;
    },
});

module.exports = Collection;
