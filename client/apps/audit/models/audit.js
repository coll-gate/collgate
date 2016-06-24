/**
 * @file audit.js
 * @brief Audit model
 * @author Frederic SCHERMA
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    defaults: {
        id: undefined,
        user: undefined,
        audit_type: '',
        content_type: '',
    },

    init: function(options) {
        options || (options = {});
    },

    parse: function(data) {
        this.perms = data.perms;
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
