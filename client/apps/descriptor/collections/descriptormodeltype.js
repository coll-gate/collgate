/**
 * @file descriptormodeltype.js
 * @brief Descriptors of layout panel collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let LayoutDescriptor = require('../models/layoutdescriptor');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['descriptor', 'layout', this.layout_id, 'panel', this.model_id]);
    },

    model: LayoutDescriptor,
    comparator: 'position',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.model_id = options.model_id;
        this.layout_id = options.layout_id;
    }
});

module.exports = Collection;
