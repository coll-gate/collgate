/**
 * @file layout.js
 * @brief Layout of descriptors collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let CountableCollection = require('../../main/collections/countable');
let LayoutModel = require('../models/layout');

let Collection = CountableCollection.extend({
    url: window.application.url(['descriptor', 'layout']),
    model: LayoutModel,
});

module.exports = Collection;
