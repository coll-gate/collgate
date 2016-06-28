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
        type: 0,
        user_id: undefined,
        username: '',
        app_label: '',
        model: undefined,
        object_id: undefined,
        object_name: '',
        reason: '',
        fields: []
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
