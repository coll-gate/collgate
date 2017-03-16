/**
 * @file country.js
 * @brief Country model
 * @author Medhi BOULNEMOUR
 * @date 2017-02-23
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */


var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    defaults: {
        display_names: '',
        cou_id: null,
        lat: null,
        code3: '',
        name: '',
        long: null
    },

    parse: function(data) {
        return data;
    }
});

module.exports = Model;
