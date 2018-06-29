/**
 * @file comment.js
 * @brief comment model
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2018-06-26
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function () {
        if (this.model) {
            // return window.application.url(['descriptor', 'descriptor', this.get('id')]);
            return (_.isFunction(this.model.url) ? this.model.url() : this.model.url) + 'comment/' + this.get('id');
        } else {
            return (_.isFunction(this.model.url) ? this.model.url() : this.model.url) + 'comment/';
        }
    },

    defaults: {
        id: null,
        label: '',
        value: ''
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

