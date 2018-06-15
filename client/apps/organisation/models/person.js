/**
 * @file person.js
 * @brief Person model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-01
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['organisation', 'person']);
        else
            return window.application.url(['organisation', 'person', this.get('id')]);
    },

    defaults: {
        id: null,
        name: "",
        establishment: null,
        layout: null,
        descriptors: {}
    }
});

module.exports = Model;
