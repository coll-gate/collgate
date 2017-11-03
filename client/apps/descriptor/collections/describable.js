/**
 * @file describable.js
 * @brief Describable entities collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-11-17
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescribableModel = require('../models/describable');

let Collection = Backbone.Collection.extend({
    url: window.application.url(['descriptor', 'describable']),
    model: DescribableModel,

    parse: function (data) {
        return data;
    },

    default: [],

    findLabel: function (value) {
        let res = this.findWhere({value: value});
        return res ? res.get('label') : '';
    },
});

module.exports = Collection;

