/**
 * @file classification.js
 * @brief Classification collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-31
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var CountableCollection = require('../../main/collections/countable');
var ClassificationModel = require('../models/classification');

var Collection = CountableCollection.extend({
    url: application.baseUrl + 'classification/classification/',
    model: ClassificationModel
});

module.exports = Collection;
