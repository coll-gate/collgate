/**
 * @file batchpanel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-03
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchPanelModel = require('../models/batchpanel');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function () {
        if (this.batch_id) {
            return window.application.url(['accession', 'batch', this.batch_id, 'panels'])
        } else {
            return window.application.url(['accession', 'batchpanel'])
        }
    },
    model: BatchPanelModel,

    initialize: function (options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.batch_id = options.batch_id;
    }
});

module.exports = Collection;
