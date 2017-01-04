/**
 * @file descriptortypeunit.js
 * @brief Descriptor type unit collection
 * @author Frederic SCHERMA
 * @date 2017-01-04
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorTypeUnitModel = require('../models/descriptortype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'descriptor/typeunit/',
    model: DescriptorTypeUnitModel,

    initialize: function(models, options) {
        Collection.__super__.initialize.apply(this);
        this.models = [];
        this.lookup = {};

        for (var i = 0; i < this.defaults.length; ++i) {
            var model = this.defaults[i];
            this.lookup[model.id] = model.label;
            this.models.push(new DescriptorTypeUnitModel({
                id: model.id,
                value: model.value,
                group: model.group,
                group_label: model.group_label,
                label: model.label
            }));
        }
    },

    parse: function(data) {
        return data;
    },

    fetch: function(options) {
        // avoid fetching
    },

    defaults: [
        {id: 'chroma_L_value', group: 'chroma', group_label: 'Chroma', label: gt.gettext("L value")},
        {id: 'chroma_a_value', group: 'chroma', group_label: 'Chroma', label: gt.gettext("a value")},
        {id: 'chroma_b_value', group: 'chroma', group_label: 'Chroma', label: gt.gettext("b value")},

        {id: 'degree_celsius',group: 'common', group_label: 'Common', label: gt.gettext("°C")},
        {id: 'category', group: 'common', group_label: 'Common', label: gt.gettext("Category")},
        {id: 'custom', group: 'common', group_label: 'Common', label: gt.gettext("Custom")},
        {id: 'joule', group: 'common', group_label: 'Common', label: gt.gettext("J (joule)")},
        {id: 'norm1', group: 'common', group_label: 'Common', label: gt.gettext("°Norm 1")},
        {id: 'note', group: 'common', group_label: 'Common', label: gt.gettext("Note")},
        {id: 'percent', group: 'common', group_label: 'Common', label: gt.gettext("% (percent)")},
        {id: 'regexp', group: 'common', group_label: 'Common', label: gt.gettext("Regular expression")},
        {id: 'scale', group: 'common', group_label: 'Common', label: gt.gettext("Scale")},

        {id: 'gram_per_100_grain', group: 'grain', group_label: 'Grain', label: gt.gettext("g/100 grain")},
        {id: 'gram_per_200_grain', group: 'grain', group_label: 'Grain', label: gt.gettext("g/200 grain")},
        {id: 'gram_per_1000_grain', group: 'grain', group_label: 'Grain', label: gt.gettext("g/1000 grain")},
        {id: 'grain_per_meter2', group: 'grain', group_label: 'Grain', label: gt.gettext("grain/m²")},
        {id: 'grain_per_spike', group: 'grain', group_label: 'Grain', label: gt.gettext("grain/spike")},
        {id: 'grain_per_spikelet', group: 'grain', group_label: 'Grain', label: gt.gettext("grain/spikelet")},

        {id: 'micrometer', group: 'meter', group_label: 'Meter', label: gt.gettext("um")},
        {id: 'millimeter', group: 'meter', group_label: 'Meter', label: gt.gettext("mm")},
        {id: 'centimeter', group: 'meter', group_label: 'Meter', label: gt.gettext("cm")},
        {id: 'decimeter', group: 'meter', group_label: 'Meter', label: gt.gettext("dm")},
        {id: 'meter', group: 'meter', group_label: 'Meter', label: gt.gettext("m")},
        {id: 'kilometer', group: 'meter', group_label: 'Meter', label: gt.gettext("km")},

        {id: 'plant_per_meter', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("plant/m")},
        {id: 'plant_per_meter2', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("plant/m²")},
        {id: 'plant_per_hectare', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("plant/ha")},
        {id: 'plant_per_plot', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("plant/plot")},
        {id: 'gram_per_plant', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("g/plant")},
        {id: 'gram_per_plot', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("g/plot")},
        {id: 'kilogram_per_plot', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("kg/plot")},
        {id: 'stoma_per_millimeter2', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("stoma/mm²")},
        {id: 'node', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("node")},
        {id: 'spikelet', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("spikelet")},
        {id: 'spike_per_meter2', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("spike/m²")},
        {id: 'tiller_per_meter', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("tiller/m")},
        {id: 'tiller_per_meter2', group: 'plant_and_plot', group_label: 'Plant and plot', label: gt.gettext("tiller/m²")},

        {id: 'milliliter', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("ml")},
        {id: 'milliliter_per_percent', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("ml/%")},
        {id: 'ppm', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("ppm")},
        {id: 'milligram_per_kilogram', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("mg/kg")},
        {id: 'gram_per_kilogram', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("g/kg")},
        {id: 'gram_per_meter2', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("g/m²")},
        {id: 'kilogram_per_hectare', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("kh/ha")},
        {id: 'ton_per_hectare', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("t/ha")},
        {id: 'gram_per_liter', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("g/l")},
        {id: 'kilogram_per_hectolitre', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("kg/hl")},
        {id: 'millimol_per_meter2_per_second', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("mmol/m²/s")},
        {id: 'gram_per_meter2_per_day', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("g/m²/day")},
        {id: 'ccl', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("CCl (chlore)")},
        {id: 'delta_13c', group: 'quantity_and_volume', group_label: 'Quantity and volume', label: gt.gettext("delta 13C (carbon)")},

        {id: 'millimeter2', group: 'surface', group_label: 'Surface', label: gt.gettext("mm²")},
        {id: 'centimeter2', group: 'surface', group_label: 'Surface', label: gt.gettext("cm²")},
        {id: 'meter2', group: 'surface', group_label: 'Surface', label: gt.gettext("m²")},
        {id: 'hectare', group: 'surface', group_label: 'Surface', label: gt.gettext("ha")},
        {id: 'kilometer2', group: 'surface', group_label: 'Surface', label: gt.gettext("km²")},

        {id: 'millisecond', group: 'time', group_label: 'Time', label: gt.gettext("ms")},
        {id: 'second', group: 'time', group_label: 'Time', label: gt.gettext("s")},
        {id: 'minute', group: 'time', group_label: 'Time', label: gt.gettext("min")},
        {id: 'hour', group: 'time', group_label: 'Time', label: gt.gettext("hour")},
        {id: 'day', group: 'time', group_label: 'Time', label: gt.gettext("day")},
        {id: 'month', group: 'time', group_label: 'Time', label: gt.gettext("month")},
        {id: 'year', group_label: 'Time', label: gt.gettext("year")},
        {id: 'date', group: 'time', group_label: 'Time', label: gt.gettext("date")},
        {id: 'time', group: 'time', group_label: 'Time', label: gt.gettext("time with seconds")},
        {id: 'datetime', group: 'time', group_label: 'Time', label: gt.gettext("date+time")},
        {id: 'percent_per_minute', group: 'time', group_label: 'Time', label: gt.gettext("%/min")},
        {id: 'percent_per_hour', group: 'time', group_label: 'Time', label: gt.gettext("%/hour")},
        {id: 'percent_per_day', group: 'time', group_label: 'Time', label: gt.gettext("%/day")}
    ],

    findLabel: function(value) {
        return this.lookup[value];
        //var res = this.findWhere({value: value});
        //return res ? res.get('label') : '';
    },
});

module.exports = Collection;
