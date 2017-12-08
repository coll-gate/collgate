/**
 * @file batchaction.js
 * @brief Batch-action model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-08
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['accession', 'batchaction']);
        else
            return window.application.url(['accession', 'batchaction', this.get('id')]);
    },

    defaults: {
        id: 0,
        name: '',
        input_batches: [],
        output_batched: [],
        accession: null,
        type: null
    },

    parse: function(data) {
        return data;
    }
});

module.exports = Model;
