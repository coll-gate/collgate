/**
 * @file descriptormodeltype.js
 * @brief Types of models of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorModelTypeModel = require('../models/descriptormodeltype');

var Collection = Backbone.Collection.extend({
    url: function() {
        return application.baseUrl + 'descriptor/model/' + this.model_id + '/type/';
    },

    model: DescriptorModelTypeModel,

    initialize: function(models, options) {
        options || (options = {});
        this.model_id = options.model_id;
    },

    parse: function(data) {
        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;

        return data.items;
    },

    comparator: 'position'
});

module.exports = Collection;

