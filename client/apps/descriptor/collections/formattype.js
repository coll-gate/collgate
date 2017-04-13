/**
 * @file formattype.js
 * @brief Descriptor type format type collection
 * @author Frederic SCHERMA
 * @date 2017-01-05
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var FormatTypeModel = require('../models/formattype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/format/type/',
    model: FormatTypeModel,

    initialize: function(models, options) {
        Collection.__super__.initialize.apply(this);

        this.models = [];
        this.lookup = {};

        for (var i = 0; i < this.items.length; ++i) {
            var model = this.items[i];
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
        var results = [];
        var groups = {};

        // init groups
        for (var i = 0; i < this.groups.length; ++i) {
            var group = this.groups[i];
            groups[group.group] = {id: -1, value: "", label: group.label, options: []};
            results.push(groups[group.group]);
        }

        for (var i = 0; i < this.models.length; ++i) {
            var model = this.models[i];
            var group = groups[model.get('group')];

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
        {group: 'single', label: gt.gettext('Single value')},
        {group: 'list', label: gt.gettext('List of values')}
    ],

    items: [
        {id: 'boolean', group: 'single', label: gt.gettext('Boolean')},
        {id: 'numeric', group: 'single', label: gt.gettext('Numeric')},
        {id: 'numeric_range', group: 'single', label: gt.gettext('Numeric range')},
        {id: 'ordinal', group: 'single', label: gt.gettext('Ordinal')},
        {id: 'string', group: 'single', label: gt.gettext('Text')},
        {id: 'date', group: 'single', label: gt.gettext('Date')},
        {id: 'imprecise_date', group: 'single', label: gt.gettext('Imprecise date')},
        {id: 'time', group: 'single', label: gt.gettext('Time')},
        {id: 'datetime', group: 'single', label: gt.gettext('Date+time')},
        {id: 'entity', group: 'single', label: gt.gettext('Entity')},
        {id: 'media', group: 'single', label: gt.gettext('Media')},
        {id: 'media_collection', group: 'single', label: gt.gettext('Media collection')},

        {id: 'enum_single', group: 'list', label: gt.gettext('Single enumeration')},
        {id: 'enum_pair', group: 'list', label: gt.gettext('Pair enumeration')},
        {id: 'enum_ordinal', group: 'list', label: gt.gettext('Ordinal with text')}
    ],

    findLabel: function(value) {
        return this.lookup[value];
    },
});

module.exports = Collection;
