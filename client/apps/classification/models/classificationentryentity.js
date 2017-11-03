/**
 * @file classificationentryentity.js
 * @brief Classification entry entity model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    defaults: {
        id: null,
        name: '',
        content_type: null
    },

    parse: function(data) {
        return data;
    }
});

module.exports = Model;
