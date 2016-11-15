/**
 * @file descriptortype.js
 * @brief Type of descriptor model
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        var group_id = this.group_id || this.get('group') || this.collection.group_id;

        if (this.isNew()) {
            return application.baseUrl + 'descriptor/group/' + group_id + '/type/';
        }
        else
            return application.baseUrl + 'descriptor/group/' + group_id + '/type/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        group: null,
        name: '',
        values: null,
        format: {type: 'string'},
        can_delete: false,
        can_modify: false,
        description: ''
    },

    initialize: function(attributes, options) {
        Model.__super__.initialize.apply(this, arguments);

        options || (options = {});
        this.group_id = options.group_id;
        this.collection = options.collection;

        if (options.collection) {
            this.group_id = options.collection.group_id;
        }
    },

    parse: function(data) {
        //this.perms = data.perms;
        this.group = data.group;
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
