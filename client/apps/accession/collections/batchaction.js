/**
 * @file batchaction.js
 * @brief
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2017-12-08
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchActionModel = require('../models/batchaction');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function () {
        if (this.batch_id) {
            return window.application.url(['accession', 'batch', this.batch_id, 'batchaction'])
        } else {
            return window.application.url(['accession', 'batchaction'])
        }
    },
    model: BatchActionModel,

    initialize: function (options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.batch_id = options.batch_id;
    }
});

module.exports = Collection;
