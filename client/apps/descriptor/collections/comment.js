/**
 * @file comment.js
 * @brief Comment collection
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2018-06-26
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let CommentModel = require('../models/comment');
let CountableCollection = require('../../main/collections/countable');

let Collection = CountableCollection.extend({
    url: function () {
        if (this.model) {
            return (_.isFunction(this.model.url) ? this.model.url() : this.model.url) + 'comment/';
            // return window.application.url([_.isFunction(this.model.url) ? this.model.url() : this.model.url, 'comment']);
        } else {
            return null;
        }
    },

    model: CommentModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        if (options.model) {
            this.model = options.model;
        }
    }
});

module.exports = Collection;
