/**
 * @file actiontype.js
 * @brief Action type model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew()) {
            return window.application.url(['accession', 'actiontype']);
        } else {
            return window.application.url(['accession', 'actiontype', this.get('id')]);
        }
    },

    defaults: {
        id: null,
        name: "",
        label: "",
        format: {type: 'undefined', steps: []},
        description: ""
    },

    parse: function(data) {
        return data;
    }
});

module.exports = Model;
