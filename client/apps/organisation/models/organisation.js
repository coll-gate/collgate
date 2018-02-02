/**
 * @file organisation.js
 * @brief Organisation model
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
            return window.application.url(['organisation', 'organisation']);
        else
            return window.application.url(['organisation', 'organisation', this.get('id')]);
    },

    defaults: {
        id: null,
        name: "",
        type: "",
        grc: null,
        layout: null,
        descriptors: {}
    }
});

module.exports = Model;
