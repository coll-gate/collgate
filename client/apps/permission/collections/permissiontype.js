/**
 * @file permissiontype.js
 * @brief Permission type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let PermissionTypeModel = require('../models/permissiontype');

let Collection = Backbone.Collection.extend({
    url: window.application.url(['permission', 'type']),
    model: PermissionTypeModel,

    toJSON: function() {
        let result = [];
        let prev = "";
        let group = {};

        for (let i = 0; i < this.models.length; ++i) {
            let model = this.models[i];
            let value = model.get('value').split('.');
            let f = value[0] + '.' + value[1];

            if (f !== prev) {
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
        for (let r in this.models) {
            let m = this.models[r];
            if (m.get('id') === id)
                return m.get('value');
        }
        // let res = this.findWhere({id: id});
        // return res ? res.get('value') : '';
    },

    findLabel: function(value) {
        for (let r in this.models) {
            let m = this.models[r];
            if (m.get('value') === value)
                return m.get('label');
        }
        // let res = this.findWhere({id: id});
        // return res ? res.get('label') : '';
    }
});

module.exports = Collection;
