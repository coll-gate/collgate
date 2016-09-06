/**
 * @file permissiontype.js
 * @brief Permission type collection
 * @author Frederic SCHERMA
 * @date 2016-04-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var PermissionTypeModel = require('../models/permissiontype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'permission/type/',
    model: PermissionTypeModel,

    parse: function(data) {
        var result = [];
        var prev = "";
        var group = {};

        for (var i = 0; i < data.length; ++i) {
            var id = data[i].id.split('.');
            var f = id[0] + '.' + id[1];

            if (f != prev) {
                group = {value: f, options: []};
                result.push(group);
            }

            group.options.push(data[i]);
            prev = f;
        }

        return result;
    },

    default: [
    ],

    findValue: function(id) {
        var res = this.findWhere({id: id});
        return res ? res.get('value') : '';
        /*for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') == id)
                return m.get('value');
        }*/
    },
});

module.exports = Collection;
