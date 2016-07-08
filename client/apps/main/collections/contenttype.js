/**
 * @file contenttype.js
 * @brief Content type collection
 * @author Frederic SCHERMA
 * @date 2016-07-08
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var ContentTypeModel = require('../models/contenttype');

var Collection = Backbone.Collection.extend({
    url: ohgr.baseUrl + 'main/content-type',
    model: ContentTypeModel,

    parse: function(data) {
        var result = [];
        var prev = "";
        var group = {};

        for (var i = 0; i < data.length; ++i) {
            var id = data[i].id.split('.');

            if (id[0] != prev) {
                group = {value: id[0], options: []};
                result.push(group);
            }

            group.options.push({id: data[i].id, value: id[1]});
            prev = id[0];
        }

        return result;
    },

    default: [],

    findValue: function(id) {
        var res = this.findWhere({id: id});
        return res ? res.get('value') : '';
    },
});

module.exports = Collection;
