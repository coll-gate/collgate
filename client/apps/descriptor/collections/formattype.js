/**
 * @file formattype.js
 * @brief Descriptor type format type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-05
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let FormatTypeModel = require('../models/formattype');

let Collection = Backbone.Collection.extend({
    url: window.application.url(['descriptor', 'format', 'type']),
    model: FormatTypeModel,

    initialize: function(models, options) {
        Collection.__super__.initialize.apply(this);

        this.models = [];
        this.lookup = {};

        for (let i = 0; i < this.items.length; ++i) {
            let model = this.items[i];
            this.lookup[model.id] = model.label;
            this.models.push(new FormatTypeModel({
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
        {group: 'single', label: _t('Single value')},
        {group: 'list', label: _t('List of values')}
    ],

    items: [
        {id: 'boolean', group: 'single', label: _t('Boolean')},
        {id: 'numeric', group: 'single', label: _t('Numeric')},
        {id: 'numeric_range', group: 'single', label: _t('Numeric range')},
        {id: 'ordinal', group: 'single', label: _t('Ordinal')},
        {id: 'string', group: 'single', label: _t('Text')},
        {id: 'date', group: 'single', label: _t('Date')},
        {id: 'imprecise_date', group: 'single', label: _t('Imprecise date')},
        {id: 'time', group: 'single', label: _t('Time')},
        {id: 'datetime', group: 'single', label: _t('Date+time')},
        {id: 'entity', group: 'single', label: _t('Entity')},
        {id: 'media', group: 'single', label: _t('Media')},
        {id: 'media_collection', group: 'single', label: _t('Media collection')},

        {id: 'enum_single', group: 'list', label: _t('Single enumeration')},
        {id: 'enum_pair', group: 'list', label: _t('Pair enumeration')},
        {id: 'enum_ordinal', group: 'list', label: _t('Ordinal with text')}
    ],

    findLabel: function(value) {
        return this.lookup[value];
    },
});

module.exports = Collection;

