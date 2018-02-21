/**
 * @file actionstepformat.js
 * @brief Action type format collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let FormatModel = require('../models/actionstepformat');

let Collection = Backbone.Collection.extend({
    url: window.application.url(['accession', 'actiontype', 'stepformat']),
    model: FormatModel,

    initialize: function(models, options) {
        Collection.__super__.initialize.apply(this);

        this.models = [];
        this.lookup = {};

        for (let i = 0; i < this.items.length; ++i) {
            let model = this.items[i];
            this.lookup[model.id] = model.label;
            this.models.push(new FormatModel({
                id: model.id,
                value: model.id,
                group: model.group,
                label: model.label
            }));
        }
    },

    parse: function(data) {
        this.groups = data.groups;
        return data.items;
    },

    toJSON: function() {
        let results = [];
        let groups = {};

        // init groups
        for (let i = 0; i < this.groups.length; ++i) {
            let group = this.groups[i];
            groups[group.group] = {id: -1, value: "", label: group.label, options: []};
            results.push(groups[group.group]);
        }

        for (let i = 0; i < this.models.length; ++i) {
            let model = this.models[i];
            let group = groups[model.get('group')];

            if (model.id) {
                group.options.push({
                    id: model.get('id'),
                    value: model.get('value'),
                    label: model.get('label')
                });
            }
        }

        return results;
    },

    groups: [
        {group: 'standard', label: _t('Standard')}
    ],

    items: [
        // {id: 'boolean', group: 'standard', label: _t('Boolean')},
    ],

    findLabel: function(value) {
        return this.lookup[value];
    },
});

module.exports = Collection;
