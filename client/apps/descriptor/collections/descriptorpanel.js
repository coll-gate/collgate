/**
 * @file descriptorpanel.js
 * @brief Panel of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorPanelModel = require('../models/descriptorpanel');

let Collection = Backbone.Collection.extend({
    url: function() {
        return window.application.url(['descriptor', 'meta-model', this.model_id, 'panel']);
    },

    model: DescriptorPanelModel,

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

