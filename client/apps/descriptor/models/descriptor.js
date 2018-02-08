/**
 * @file descriptor.js
 * @brief descriptor model
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-01-10
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function () {
        if (this.isNew()) {
            return window.application.url(['descriptor', 'descriptor']);
        } else {
            return window.application.url(['descriptor', 'descriptor', this.get('id')]);
        } // else {
        //     return window.application.url(['descriptor', 'descriptor', this.get('name')]);
        // }
    },

    defaults: {
        id: null,
        name: '',
        code: '',
        label: '',
        group_name: null,
        description: '',
        can_delete: true,
        can_modify: true,
        format: {
            type: "string"
        }
    },

    parse: function (data) {
        //this.perms = data.perms;
        this.model = data.model;
        return data;
    },

    validate: function (attrs) {
        let errors = {};
        let hasError = false;

        if (hasError) {
            return errors;
        }
    },
});

module.exports = Model;

