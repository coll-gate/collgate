/**
 * @file storagelocation.js
 * @brief storage location collection
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-04-04
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let StorageLocationModel = require('../models/storagelocation');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    model: StorageLocationModel,

    url: function () {
        return window.application.url(['accession', 'storagelocation'])
    },

    initialize: function (models, options) {
        options || (options = {});
        Collection.__super__.initialize.apply(this, arguments);
    },
});

module.exports = Collection;
