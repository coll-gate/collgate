/**
 * @file batchactiontype.js
 * @brief Batch-action type model
 * @author Frederic SCHERMA
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

module.exports = Backbone.Model.extend({
    url: application.baseUrl + 'accession/batch-action-type/:id/',

    defaults: function() {
        return {
            id: 0,
            value: 0,
            label: ''
        }
    }
});
