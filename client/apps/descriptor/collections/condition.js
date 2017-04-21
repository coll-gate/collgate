/**
 * @file condition.js
 * @brief Condition collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-11-22
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ConditionModel = require('../models/condition');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/condition',
    model: ConditionModel,

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

