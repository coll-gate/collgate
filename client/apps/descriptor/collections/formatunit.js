/**
 * @file formatunit.js
 * @brief Descriptor type format unit collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var FormatUnitModel = require('../models/formatunit');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/format/unit/',
    model: FormatUnitModel,

    initialize: function(models, options) {
        Collection.__super__.initialize.apply(this);

        this.models = [];
        this.lookup = {};

        for (var i = 0; i < this.items.length; ++i) {
            var model = this.items[i];
            this.lookup[model.id] = model.label;
            this.models.push(new FormatUnitModel({
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
        {group: 'chroma', label: gt.gettext('Chroma')},
        {group: 'common', label: gt.gettext('Common')},
        {group: 'grain', label: gt.gettext('Grain')},
        {group: 'meter', label: gt.gettext('Meter')},
        {group: 'weight', label: gt.gettext('Weight')},
        {group: 'plant_and_plot', label: gt.gettext('Plant and plot')},
        {group: 'quantity_and_volume', label: gt.gettext('Quantity and volume')},
        {group: 'surface', label: gt.gettext('Surface')},
        {group: 'time', label: gt.pgettext('concept', 'Time')}
    ],

    items: [
        {id: 'chroma_L_value', group: 'chroma', label: gt.gettext("L value")},
        {id: 'chroma_a_value', group: 'chroma', label: gt.gettext("a value")},
        {id: 'chroma_b_value', group: 'chroma', label: gt.gettext("b value")},

        {id: 'degree_celsius',group: 'common', label: gt.gettext("°C")},
        {id: 'category', group: 'common', label: gt.gettext("Category")},
        {id: 'custom', group: 'common', label: gt.gettext("Custom")},
        {id: 'joule', group: 'common', label: gt.gettext("J (joule)")},
        {id: 'norm1', group: 'common', label: gt.gettext("Norm 1")},
        {id: 'note', group: 'common', label: gt.gettext("Note")},
        {id: 'percent', group: 'common', label: gt.gettext("% (percent)")},
        {id: 'scale', group: 'common', label: gt.gettext("Scale")},

        {id: 'gram_per_100_grain', group: 'grain', label: gt.gettext("g/100 grain")},
        {id: 'gram_per_200_grain', group: 'grain', label: gt.gettext("g/200 grain")},
        {id: 'gram_per_1000_grain', group: 'grain', label: gt.gettext("g/1000 grain")},
        {id: 'grain_per_meter2', group: 'grain', label: gt.gettext("grain/m²")},
        {id: 'grain_per_spike', group: 'grain', label: gt.gettext("grain/spike")},
        {id: 'grain_per_spikelet', group: 'grain', label: gt.gettext("grain/spikelet")},

        {id: 'micrometer', group: 'meter', label: gt.gettext("um")},
        {id: 'millimeter', group: 'meter', label: gt.gettext("mm")},
        {id: 'centimeter', group: 'meter', label: gt.gettext("cm")},
        {id: 'decimeter', group: 'meter', label: gt.gettext("dm")},
        {id: 'meter', group: 'meter', label: gt.gettext("m")},
        {id: 'kilometer', group: 'meter', label: gt.gettext("km")},

        {id: 'gram', group: 'weight', label: gt.gettext("g")},
        {id: 'kilogram', group: 'weight', label: gt.gettext("kg")},

        {id: 'plant_per_meter', group: 'plant_and_plot', label: gt.gettext("plant/m")},
        {id: 'plant_per_meter2', group: 'plant_and_plot', label: gt.gettext("plant/m²")},
        {id: 'plant_per_hectare', group: 'plant_and_plot', label: gt.gettext("plant/ha")},
        {id: 'plant_per_plot', group: 'plant_and_plot', label: gt.gettext("plant/plot")},
        {id: 'gram_per_plant', group: 'plant_and_plot', label: gt.gettext("g/plant")},
        {id: 'gram_per_plot', group: 'plant_and_plot', label: gt.gettext("g/plot")},
        {id: 'kilogram_per_plot', group: 'plant_and_plot', label: gt.gettext("kg/plot")},
        {id: 'stoma_per_millimeter2', group: 'plant_and_plot', label: gt.gettext("stoma/mm²")},
        {id: 'node', group: 'plant_and_plot', label: gt.gettext("node")},
        {id: 'spikelet', group: 'plant_and_plot', label: gt.gettext("spikelet")},
        {id: 'spike_per_meter2', group: 'plant_and_plot', label: gt.gettext("spike/m²")},
        {id: 'tiller_per_meter', group: 'plant_and_plot', label: gt.gettext("tiller/m")},
        {id: 'tiller_per_meter2', group: 'plant_and_plot', label: gt.gettext("tiller/m²")},

        {id: 'milliliter', group: 'quantity_and_volume', label: gt.gettext("ml")},
        {id: 'milliliter_per_percent', group: 'quantity_and_volume', label: gt.gettext("ml/%")},
        {id: 'ppm', group: 'quantity_and_volume', label: gt.gettext("ppm")},
        {id: 'milligram_per_kilogram', group: 'quantity_and_volume', label: gt.gettext("mg/kg")},
        {id: 'gram_per_kilogram', group: 'quantity_and_volume', label: gt.gettext("g/kg")},
        {id: 'gram_per_meter2', group: 'quantity_and_volume', label: gt.gettext("g/m²")},
        {id: 'kilogram_per_hectare', group: 'quantity_and_volume', label: gt.gettext("kh/ha")},
        {id: 'ton_per_hectare', group: 'quantity_and_volume', label: gt.gettext("t/ha")},
        {id: 'gram_per_liter', group: 'quantity_and_volume', label: gt.gettext("g/l")},
        {id: 'kilogram_per_hectolitre', group: 'quantity_and_volume', label: gt.gettext("kg/hl")},
        {id: 'millimol_per_meter2_per_second', group: 'quantity_and_volume', label: gt.gettext("mmol/m²/s")},
        {id: 'gram_per_meter2_per_day', group: 'quantity_and_volume', label: gt.gettext("g/m²/day")},
        {id: 'ccl', group: 'quantity_and_volume', label: gt.gettext("CCl (chlore)")},
        {id: 'delta_13c', group: 'quantity_and_volume', label: gt.gettext("delta 13C (carbon)")},

        {id: 'millimeter2', group: 'surface', label: gt.gettext("mm²")},
        {id: 'centimeter2', group: 'surface', label: gt.gettext("cm²")},
        {id: 'meter2', group: 'surface', label: gt.gettext("m²")},
        {id: 'hectare', group: 'surface', label: gt.gettext("ha")},
        {id: 'kilometer2', group: 'surface', label: gt.gettext("km²")},

        {id: 'millisecond', group: 'time', label: gt.gettext("ms")},
        {id: 'second', group: 'time', label: gt.gettext("s")},
        {id: 'minute', group: 'time', label: gt.gettext("min")},
        {id: 'hour', group: 'time', label: gt.gettext("hour")},
        {id: 'day', group: 'time', label: gt.gettext("day")},
        {id: 'month', group: 'time', label: gt.gettext("month")},
        {id: 'year', group: 'time', label: gt.gettext("year")},
        {id: 'date', group: 'time', label: gt.gettext("Date")},
        {id: 'time', group: 'time', label: gt.gettext("Time")},
        {id: 'datetime', group: 'time', label: gt.gettext("Date Time")},
        {id: 'percent_per_minute', group: 'time', label: gt.gettext("%/min")},
        {id: 'percent_per_hour', group: 'time', label: gt.gettext("%/hour")},
        {id: 'percent_per_day', group: 'time', label: gt.gettext("%/day")}
    ],

    findLabel: function(value) {
        return this.lookup[value];
        //var res = this.findWhere({value: value});
        //return res ? res.get('label') : '';
    },
});

module.exports = Collection;
