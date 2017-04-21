/**
 * @file permissiontype.js
 * @brief Permission type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var PermissionTypeModel = require('../models/permissiontype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'permission/type/',
    model: PermissionTypeModel,

    toJSON: function() {
        var result = [];
        var prev = "";
        var group = {};

        for (var i = 0; i < this.models.length; ++i) {
            var model = this.models[i];
            var value = model.get('value').split('.');
            var f = value[0] + '.' + value[1];

            if (f != prev) {
                group = {id: -1, value: "", label: f, options: []};
                result.push(group);
            }

            group.options.push({
                id: model.get('id'),
                value: model.get('value'),
                label: model.get('label')
            });

            prev = f;
        }

        return result;
    },

    findValue: function(id) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') == id)
                return m.get('value');
        }
        // var res = this.findWhere({id: id});
        // return res ? res.get('value') : '';
    },

    findLabel: function(value) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('value') == value)
                return m.get('label');
        }
        // var res = this.findWhere({id: id});
        // return res ? res.get('label') : '';
    }
});

module.exports = Collection;

