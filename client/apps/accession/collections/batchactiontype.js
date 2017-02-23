/**
 * @file batchactiontype.js
 * @brief Batch-action type collection
 * @author Frederic SCHERMA
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var BatchActionTypeModel = require('../models/batchactiontype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'accession/batch-action-type/',
    model: BatchActionTypeModel,

    findValue: function(id) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') == id)
                return m.get('value');
        }
    },

    findLabel: function(value) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('value') == value)
                return m.get('label');
        }
    }
});

module.exports = Collection;
