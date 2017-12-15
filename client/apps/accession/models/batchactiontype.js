/**
 * @file batchactiontype.js
 * @brief Batch-action type model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['accession', 'batchactiontype']);
        else
            return window.application.url(['accession', 'batchactiontype', this.get('id')]);
    },

    defaults: {
        id: 0,
        name: '',
        label: '',
        format: {type: undefined}
    },

    parse: function(data) {
        return data;
    }
});

module.exports = Model;
