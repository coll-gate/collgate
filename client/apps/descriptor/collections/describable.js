/**
 * @file describable.js
 * @brief Describable entities collection
 * @author Frederic SCHERMA
 * @date 2016-11-17
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableModel = require('../models/describable');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/describable',
    model: DescribableModel,

    parse: function(data) {
        return data;
    },

    default: [
    ],

    findLabel: function(value) {
        var res = this.findWhere({value: value});
        return res ? res.get('label') : '';
    },
});

module.exports = Collection;
