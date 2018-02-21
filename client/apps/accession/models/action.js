/**
 * @file action.js
 * @brief Action model
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
            return window.application.url(['accession', 'action']);
        else
            return window.application.url(['accession', 'action', this.get('id')]);
    },

    defaults: {
        id: null,
        name: '',
        action_type: null,
        completed: false,
        data: {steps: []},
        user: '',
        description: ''
    },

    parse: function(data) {
        return data;
    }
});

module.exports = Model;
