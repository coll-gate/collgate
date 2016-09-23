/**
 * @file descriptorvalue.js
 * @brief Value for a type of descriptor model
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'accession/descriptor/group/' + this.group_id + '/type/' + this.type_id + '/value/';
        else
            return application.baseUrl + 'accession/descriptor/group/' + this.group_id + '/type/' + this.type_id + '/value/' + this.id + '/';
    },

    defaults: {
        id: null,
        parent: null,
        ordinal: null,
        value0: null,
        value1: null,
    },

    initialize: function(options) {
        Model.__super__.initialize.apply(this, arguments);

        options || (options = {});
        if (typeof (options.group_id) != "undefined") {
            this.group_id = options.group_id;
        }

        if (typeof (options.type_id) != "undefined") {
            this.type_id = options.type_id;
        }
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
