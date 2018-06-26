/**
 * @file establishment.js
 * @brief Establishment model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['organisation', 'establishment']);
        else
            return window.application.url(['organisation', 'establishment', this.get('id')]);
    },

    defaults: {
        id: null,
        name: "",
        organisation: null,
        layout: null,
        descriptors: {},
        comments: []
    }
});

module.exports = Model;
