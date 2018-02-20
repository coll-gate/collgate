/**
 * @file index.js
 * @brief Collection of descriptor indexes
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-02-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let IndexModel = require('../models/index');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        return window.application.url(['descriptor', 'index']);
    },
    model: IndexModel
});

module.exports = Collection;