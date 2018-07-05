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
        if (this.isNew()) {
            return (_.isFunction(this.collection.entity.url) ? this.collection.entity.url() : this.collection.entity.url) + 'comment/';
        } else {
            return (_.isFunction(this.collection.entity.url) ? this.collection.entity.url() : this.collection.entity.url) + 'comment/' + this.get('id') + '/';
        }
    },

    defaults: {
        id: null,
        label: '',
        value: ''
    },

    parse: function (data) {
        //this.perms = data.perms;
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

