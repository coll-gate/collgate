/**
 * @file descriptorvalue.js
 * @brief List of value for a type of descriptor (collection)
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorTypeModel = require('../models/descriptorvalue');

var Collection = Backbone.Collection.extend({
    url: function() {
        return application.baseUrl + 'accession/descriptor/group/' + this.group_id + '/type/' + this.type_id + '/value/';
    },

    model: DescriptorTypeModel,

    initialize: function(models, options) {
        options || (options = {});
        this.group_id = options.group_id;
        this.type_id = options.type_id;
        this.format = options.format || {type: "string", fields: ["name"]};
    },

    parse: function(data) {
        if (data.format) {
            this.format = data.format;
        }

        this.page = data.page;
        this.total_count = data.total_count;

        return data.items;
    },
});

module.exports = Collection;
