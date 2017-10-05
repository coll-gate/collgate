/**
 * @file classificationentry.js
 * @brief Classification entry collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var CountableCollection = require('../../main/collections/countable');
var ClassificationEntryModel = require('../models/classificationentry');

var Collection = CountableCollection.extend({
    url: function() {
        if (this.classification_id) {
            return application.baseUrl + 'classification/classification/' + this.classification_id + '/classificationentry/';
        } else {
            return application.baseUrl + 'classification/classificationentry/';
        }
    },
    model: ClassificationEntryModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        CountableCollection.__super__.initialize.apply(this, arguments);

        if (options.classification_id) {
            this.classification_id = options.classification_id;
        }
    }
});

module.exports = Collection;
