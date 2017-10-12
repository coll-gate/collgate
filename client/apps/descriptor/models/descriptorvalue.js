/**
 * @file descriptorvalue.js
 * @brief Value for a type of descriptor model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['descriptor', 'group', this.group_id, 'type', this.type_id, 'value']);
        else
            return window.application.url(['descriptor', 'group', this.group_id, 'type', this.type_id, 'value', this.id]);
    },

    defaults: {
        id: null,
        parent: null,
        ordinal: null,
        value0: null,
        value1: null,
    },

    initialize: function(attributes, options) {
        Model.__super__.initialize.apply(this, arguments);

        options || (options = {});
        this.group_id = options.group_id;
        this.type_id = options.type_id;

        if (options.collection) {
            this.type_id = options.collection.type_id;
            this.group_id = options.collection.group_id;
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

