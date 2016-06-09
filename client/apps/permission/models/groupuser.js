/**
 * @file groupuser.js
 * @brief User model from a group
 * @author Frederic SCHERMA
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return ohgr.baseUrl + 'permission/group/' + this.collection.name + '/user/';
        else
            return ohgr.baseUrl + 'permission/group/' + this.collection.name + '/user/' + this.get('username') + '/';
    },

    defaults: {
        id: undefined,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
    },

    init: function(options) {
        options || (options = {});
        this.name = options.name;
    },

    parse: function(data) {
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
