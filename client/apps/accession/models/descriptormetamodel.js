/**
 * @file descriptormetamodel.js
 * @brief Meta-model of descriptor
 * @author Frederic SCHERMA
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'accession/descriptor/meta-model/';
        else
            return application.baseUrl + 'accession/descriptor/meta-model/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: '',
        label: '',
        description: '',
        target: '',
        num_descriptor_models: 0,
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
