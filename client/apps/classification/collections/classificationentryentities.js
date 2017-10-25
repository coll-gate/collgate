/**
 * @file taxonentities.js
 * @brief Taxon children entities collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let ClassificationEntryEntityModel = require('../models/classificationentryentity');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['classification', 'classificationentry', this.model_id, 'entities']);
    },
    model: ClassificationEntryEntityModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});
        this.model_id = options.model_id;

        Collection.__super__.initialize.apply(this, arguments);
    }
});

module.exports = Collection;
