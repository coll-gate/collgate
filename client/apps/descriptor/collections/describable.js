/**
 * @file describable.js
 * @brief Describable entities collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-11-17
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var DescribableModel = require('../models/describable');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/describable',
    model: DescribableModel,

    parse: function (data) {
        return data;
    },

    default: [],

    findLabel: function (value) {
        var res = this.findWhere({value: value});
        return res ? res.get('label') : '';
    },
});

module.exports = Collection;

