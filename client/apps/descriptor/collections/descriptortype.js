/**
 * @file descriptortype.js
 * @brief Types of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let DescriptorTypeModel = require('../models/descriptortype');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['descriptor', 'group', this.group_id, 'type']);
    },

    model: DescriptorTypeModel,

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.group_id = options.group_id;
    }
});

module.exports = Collection;
