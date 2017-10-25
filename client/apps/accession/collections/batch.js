/**
 * @file batch.js
 * @brief Batch collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let BatchModel = require('../models/batch');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function() {
        if (this.panel_id) {
            return window.application.url(['accession', 'batchpanel', this.panel_id, 'batches']);
        } else if (this.accession_id) {
            return window.application.url(['accession', 'accession', this.accession_id, 'batch']);
        } else if (this.batch_id) {
            if (this.batch_type === "parents") {
                return window.application.url(['accession', 'batch', this.batch_id, 'parent']);
            } else {
                return window.application.url(['accession', 'batch', this.batch_id, 'batch']);
            }
        } else {
            return window.application.url(['accession', 'batch']);
        }
    },
    model: BatchModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        this.batch_type = options.batch_type || '';
        this.accession_id = options.accession_id;
        this.batch_id = options.batch_id;
        this.panel_id = (options.panel_id || null);
    }
});

module.exports = Collection;
