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
        if (this.entity) {
            return (_.isFunction(this.entity.url) ? this.entity.url() : this.entity.url) + 'comment/';
            // return window.application.url([_.isFunction(this.entity.url) ? this.entity.url() : this.entity.url, 'comment']);
        } else {
            return null;
        }
    },

    model: CommentModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        Collection.__super__.initialize.apply(this, arguments);

        if (options.entity) {
            this.entity = options.entity;
        }
    }
});

module.exports = Collection;
