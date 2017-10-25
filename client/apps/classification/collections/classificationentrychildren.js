/**
 * @file classificationentrychildren.js
 * @brief Classification entry children collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-11-10
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let ClassificationEntryModel = require('../models/classificationentry');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['classification', 'classificationentry', this.model_id, 'children']);
    },
    model: ClassificationEntryModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.model_id = (options.model_id || null);
    }
});

module.exports = Collection;
