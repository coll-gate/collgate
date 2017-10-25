/**
 * @file classification.js
 * @brief Classification collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-31
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let CountableCollection = require('../../main/collections/countable');
let ClassificationModel = require('../models/classification');

let Collection = CountableCollection.extend({
    url: window.application.url(['classification', 'classification']),
    model: ClassificationModel
});

module.exports = Collection;
