/**
 * @file user.js
 * @brief User model
 * @author Frederic SCHERMA
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() { return ohgr.baseUrl + 'permission/user/' + this.get('username') + '/'; },

    defaults: {
        id: undefined,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        is_active: false,
        is_staff: false
    },

    isNew : function () { return typeof(this.get('username')) != 'string'; },

    init: function(options) {
        options || (options = {});
        this.username = options.username;

        this.on('change:is_active', this.partialUpdate, this);
        this.on('change:is_staff', this.partialUpdate, this);
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

    partialUpdate: function () {
        // why not working ???
        alert();
        this.save(this.model.changedAttributes(), {patch: true});
    }
});

module.exports = Model;
