/**
 * @file organisation.js
 * @brief Organisation model
 * @author Frederic SCHERMA
 * @date 2017-02-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
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
        grc: null
    }
});

module.exports = Model;
