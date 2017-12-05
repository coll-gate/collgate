/**
 * @file batchactiontype.js
 * @brief Batch-action type model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

module.exports = Backbone.Model.extend({
    url: window.application.url(['accession', 'batch-action-type', ':id']),

    defaults: function() {
        return {
            id: 0,
            name: '',
            label: '',
            format: {}
        }
    }
});
