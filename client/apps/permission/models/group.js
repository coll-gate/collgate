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
    url: function() { return ohgr.baseUrl + 'permission/group/' + this.name + '/'; },

    defaults: {
        id: undefined,
        name: undefined,
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
