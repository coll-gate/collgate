/**
 * @file taxonentity.js
 * @brief Taxon entity model
 * @author Frederic SCHERMA
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
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
