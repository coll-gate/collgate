/**
 * @file descriptormodel.js
 * @brief Model of descriptor
 * @author Frederic SCHERMA
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'accession/descriptor/model/';
        else
            return application.baseUrl + 'accession/descriptor/model/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: '',
        verbose_name: '',
        description: '',
        num_descriptors_types: 0,
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
