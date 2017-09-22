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
        Collection.__super__.initialize.apply(this, arguments);

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
        {group: 'chroma', label: _t('Chroma')},
        {group: 'common', label: _t('Common')},
        {group: 'grain', label: _t('Grain')},
        {group: 'meter', label: _t('Meter')},
        {group: 'weight', label: _t('Weight')},
        {group: 'plant_and_plot', label: _t('Plant and plot')},
        {group: 'quantity_and_volume', label: _t('Quantity and volume')},
        {group: 'surface', label: _t('Surface')},
        {group: 'time', label: _t('Time', {context: 'concept'})}
    ],

    items: [
        {id: 'chroma_L_value', group: 'chroma', label: _t("L value")},
        {id: 'chroma_a_value', group: 'chroma', label: _t("a value")},
        {id: 'chroma_b_value', group: 'chroma', label: _t("b value")},

        {id: 'degree_celsius',group: 'common', label: _t("°C")},
        {id: 'category', group: 'common', label: _t("Category")},
        {id: 'custom', group: 'common', label: _t("Custom")},
        {id: 'joule', group: 'common', label: _t("J (joule)")},
        {id: 'norm1', group: 'common', label: _t("Norm 1")},
        {id: 'note', group: 'common', label: _t("Note")},
        {id: 'percent', group: 'common', label: _t("% (percent)")},
        {id: 'scale', group: 'common', label: _t("Scale")},

        {id: 'gram_per_100_grain', group: 'grain', label: _t("g/100 grain")},
        {id: 'gram_per_200_grain', group: 'grain', label: _t("g/200 grain")},
        {id: 'gram_per_1000_grain', group: 'grain', label: _t("g/1000 grain")},
        {id: 'grain_per_meter2', group: 'grain', label: _t("grain/m²")},
        {id: 'grain_per_spike', group: 'grain', label: _t("grain/spike")},
        {id: 'grain_per_spikelet', group: 'grain', label: _t("grain/spikelet")},

        {id: 'micrometer', group: 'meter', label: _t("um")},
        {id: 'millimeter', group: 'meter', label: _t("mm")},
        {id: 'centimeter', group: 'meter', label: _t("cm")},
        {id: 'decimeter', group: 'meter', label: _t("dm")},
        {id: 'meter', group: 'meter', label: _t("m")},
        {id: 'kilometer', group: 'meter', label: _t("km")},

        {id: 'gram', group: 'weight', label: _t("g")},
        {id: 'kilogram', group: 'weight', label: _t("kg")},

        {id: 'plant_per_meter', group: 'plant_and_plot', label: _t("plant/m")},
        {id: 'plant_per_meter2', group: 'plant_and_plot', label: _t("plant/m²")},
        {id: 'plant_per_hectare', group: 'plant_and_plot', label: _t("plant/ha")},
        {id: 'plant_per_plot', group: 'plant_and_plot', label: _t("plant/plot")},
        {id: 'gram_per_plant', group: 'plant_and_plot', label: _t("g/plant")},
        {id: 'gram_per_plot', group: 'plant_and_plot', label: _t("g/plot")},
        {id: 'kilogram_per_plot', group: 'plant_and_plot', label: _t("kg/plot")},
        {id: 'stoma_per_millimeter2', group: 'plant_and_plot', label: _t("stoma/mm²")},
        {id: 'node', group: 'plant_and_plot', label: _t("node")},
        {id: 'spikelet', group: 'plant_and_plot', label: _t("spikelet")},
        {id: 'spike_per_meter2', group: 'plant_and_plot', label: _t("spike/m²")},
        {id: 'tiller_per_meter', group: 'plant_and_plot', label: _t("tiller/m")},
        {id: 'tiller_per_meter2', group: 'plant_and_plot', label: _t("tiller/m²")},

        {id: 'milliliter', group: 'quantity_and_volume', label: _t("ml")},
        {id: 'milliliter_per_percent', group: 'quantity_and_volume', label: _t("ml/%")},
        {id: 'ppm', group: 'quantity_and_volume', label: _t("ppm")},
        {id: 'milligram_per_kilogram', group: 'quantity_and_volume', label: _t("mg/kg")},
        {id: 'gram_per_kilogram', group: 'quantity_and_volume', label: _t("g/kg")},
        {id: 'gram_per_meter2', group: 'quantity_and_volume', label: _t("g/m²")},
        {id: 'kilogram_per_hectare', group: 'quantity_and_volume', label: _t("kh/ha")},
        {id: 'ton_per_hectare', group: 'quantity_and_volume', label: _t("t/ha")},
        {id: 'gram_per_liter', group: 'quantity_and_volume', label: _t("g/l")},
        {id: 'kilogram_per_hectolitre', group: 'quantity_and_volume', label: _t("kg/hl")},
        {id: 'millimol_per_meter2_per_second', group: 'quantity_and_volume', label: _t("mmol/m²/s")},
        {id: 'gram_per_meter2_per_day', group: 'quantity_and_volume', label: _t("g/m²/day")},
        {id: 'ccl', group: 'quantity_and_volume', label: _t("CCl (chlore)")},
        {id: 'delta_13c', group: 'quantity_and_volume', label: _t("delta 13C (carbon)")},

        {id: 'millimeter2', group: 'surface', label: _t("mm²")},
        {id: 'centimeter2', group: 'surface', label: _t("cm²")},
        {id: 'meter2', group: 'surface', label: _t("m²")},
        {id: 'hectare', group: 'surface', label: _t("ha")},
        {id: 'kilometer2', group: 'surface', label: _t("km²")},

        {id: 'millisecond', group: 'time', label: _t("ms")},
        {id: 'second', group: 'time', label: _t("s")},
        {id: 'minute', group: 'time', label: _t("min")},
        {id: 'hour', group: 'time', label: _t("hour")},
        {id: 'day', group: 'time', label: _t("day")},
        {id: 'month', group: 'time', label: _t("month")},
        {id: 'year', group: 'time', label: _t("year")},
        {id: 'date', group: 'time', label: _t("Date")},
        {id: 'time', group: 'time', label: _t("Time")},
        {id: 'datetime', group: 'time', label: _t("Date Time")},
        {id: 'percent_per_minute', group: 'time', label: _t("%/min")},
        {id: 'percent_per_hour', group: 'time', label: _t("%/hour")},
        {id: 'percent_per_day', group: 'time', label: _t("%/day")}
    ],

    findLabel: function(value) {
        return this.lookup[value];
        //var res = this.findWhere({value: value});
        //return res ? res.get('label') : '';
    },
});

module.exports = Collection;
