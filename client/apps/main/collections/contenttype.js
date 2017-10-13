/**
 * @file contenttype.js
 * @brief Content type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-08
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let ContentTypeModel = require('../models/contenttype');

let Collection = Backbone.Collection.extend({
    url: window.application.url(['main', 'content-type']),
    model: ContentTypeModel,

    toJSON: function() {
        let result = [];
        let prev = "";
        let group = {};

        for (let i = 0; i < this.models.length; ++i) {
            let model = this.models[i];
            let value = model.get('value').split('.');

            if (value[0] !== prev) {
                group = {id: -1, value: value[0], label: value[0], options: []};
                result.push(group);
            }

            group.options.push({
                id: model.get('id'),
                value: model.get('value'),
                label: model.get('label')
            });

            prev = value[0];
        }

        return result;
    },

    default: [],

    findValue: function(id) {
        let res = this.findWhere({id: id});
        return res ? res.get('value') : '';
    },

    findLabel: function(value) {
        let res = this.findWhere({value: value});
        return res ? res.get('label') : '';
    }
});

module.exports = Collection;
