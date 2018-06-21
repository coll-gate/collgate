/**
 * @file conservatory.js
 * @brief Conservatory model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-21
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['organisation', 'conservatory']);
        else
            return window.application.url(['organisation', 'conservatory', this.get('id')]);
    },

    defaults: {
        id: null,
        name: "",
        organisation: null,
        layout: null,
        descriptors: {}
    }
});

module.exports = Model;
