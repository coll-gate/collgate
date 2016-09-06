/**
 * @file descriptorgroup.js
 * @brief Group of descriptor model
 * @author Frederic SCHERMA
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'accession/descriptor/group/';
        else
            return application.baseUrl + 'accession/descriptor/group/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: '',
        num_descriptors_types: 0,
        can_delete: false,
        can_modify: false
    },

    parse: function(data) {
        //this.perms = data.perms;
        return data;
    },

    validate: function(attrs) {
        var errors = {};
        var hasError = false;

        if (hasError) {
          return errors;
        }
    },
});

module.exports = Model;
