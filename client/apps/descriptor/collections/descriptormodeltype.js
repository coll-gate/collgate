/**
 * @file descriptormodeltype.js
 * @brief Types of models of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorModelTypeModel = require('../models/descriptormodeltype');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['descriptor', 'layout', this.layout_id, 'panel', this.model_id]);
    },

    model: DescriptorModelTypeModel,
    comparator: 'position',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.model_id = options.model_id;
        this.layout_id = options.layout_id;
    }
});

module.exports = Collection;
