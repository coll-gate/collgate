/**
 * @file descriptorgroup.js
 * @brief Groups of descriptors collection
 * @author Frederic SCHERMA
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorGroupModel = require('../models/descriptorgroup');

var Collection = Backbone.Collection.extend({
    url: ohgr.baseUrl + 'accession/descriptor/group/',
    model: DescriptorGroupModel,

    parse: function(data) {
        this.page = data.page;
        this.total_count = data.total_count;

        return data.items;
    },
});

module.exports = Collection;
