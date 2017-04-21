/**
 * @file organisation.js
 * @brief Organisation model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'organisation/organisation/';
        else
            return application.baseUrl + 'organisation/organisation/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: "",
        type: "",
        grc: null,
        descriptor_meta_model: null,
        descriptors: {}
    }
});

module.exports = Model;

