/**
 * @file classificationentry.js
 * @brief Classification entry collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let ClassificationEntryModel = require('../models/classificationentry');

let Collection = CountableCollection.extend({
    url: function() {
        if (this.classification_id) {
            return window.application.url(['classification', 'classification', this.classification_id, 'classificationentry']);
        } else if (this.classification_entry_id) {
            return window.application.url(['classification', 'classificationentry', this.classification_entry_id, 'related']);
        } else {
            return window.application.url(['classification', 'classificationentry']);
        }
    },
    model: ClassificationEntryModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        if (options.classification_id) {
            this.classification_id = options.classification_id;
        }

        if (options.classification_entry_id) {
            this.classification_entry_id = options.classification_entry_id;
        }
    }
});

module.exports = Collection;
