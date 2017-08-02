/**
 * @file enumordinal.js
 * @brief Display and manage a list of ordinal with text values format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var EnumSingle = require('./enumsingle');
var Marionette = require('backbone.marionette');

var EnumOrdinal = function() {
    EnumSingle.call(this);

    this.name = "enum_ordinal";
    this.group = "list";
    this.allow_multiple = true
};

_.extend(EnumOrdinal.prototype, EnumSingle.prototype, {
});

EnumOrdinal.DescriptorTypeDetailsView = Marionette.View.extend({
    className: 'descriptor-type-details-format',
    template: require('../templates/widgets/enumordinal.html'),

    ui: {
        format_trans: "#format_trans",
        field0: '#type_field0',
        field1: '#type_field1',
        sort_by_field: '#sort_by_field',
        display_fields: '#display_fields',
        search_field: '#search_field',
        list_type: '#list_type',
        format_range_min: '#format_range_min',
        format_range_max: '#format_range_max'
    },

    events: {
        'change @ui.list_type': 'changeListType'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        this.ui.format_trans.selectpicker({style: 'btn-default', container: 'body'});

        this.ui.sort_by_field.selectpicker({style: 'btn-default'});
        this.ui.list_type.selectpicker({style: 'btn-default'});
        this.ui.display_fields.selectpicker({style: 'btn-default'});
        this.ui.search_field.selectpicker({style: 'btn-default'});

        this.ui.format_range_min.numeric({decimal : false, negative : false, maxDecimalPlaces: 0});
        this.ui.format_range_max.numeric({decimal : false, negative : false, maxDecimalPlaces: 0});

        var format = this.model.get('format');

        if (format.range !== undefined) {
            this.ui.format_range_min.val(format.range[0]);
            this.ui.format_range_max.val(format.range[1]);
        } else {
            this.ui.format_range_min.val("0");
            this.ui.format_range_max.val("10");
        }

        if (format.trans) {
            this.ui.format_trans.val("true").selectpicker('refresh');
        } else {
            this.ui.format_trans.val("false").selectpicker('refresh');
        }

        if (format.fields != undefined) {
            if (format.fields.length >= 1)
                this.ui.field0.val(format.fields[0]);
        }

        if (format.sortby_field != undefined) {
            this.ui.sort_by_field.selectpicker('val', format.sortby_field);
        }

        if (format.display_fields != undefined) {
            this.ui.display_fields.selectpicker('val', format.display_fields);
        }

        if (format.list_type != undefined) {
            this.ui.list_type.selectpicker('val', format.list_type);
        }

        if (format.list_type != undefined) {
            if (format.list_type === "dropdown") {
                this.ui.search_field.val('value0').prop('disabled', true).selectpicker('refresh');
            } else if (format.search_field) {
                this.ui.search_field.selectpicker('val', format.search_field);
            }
        } else {
            this.ui.search_field.val('value0').prop('disabled', true).selectpicker('refresh');
        }
    },

    changeListType: function () {
        var listType = this.ui.list_type.val();

        switch (listType) {
            case "dropdown":
                this.ui.search_field.val('value0').prop('disabled', true).selectpicker('refresh');
                break;
            default:
                this.ui.search_field.val('value0').prop('disabled', false).selectpicker('refresh');
                break;
        }
    },

    getFormat: function() {
        return {
            'trans': this.ui.format_trans.val() === "true",
            'fields': [this.ui.field0.val()],
            'sortby_field': this.ui.sort_by_field.val(),
            'display_fields': this.ui.display_fields.val(),
            'list_type': this.ui.list_type.val(),
            'search_field': this.ui.search_field.val(),
            'range': [
                this.ui.format_range_min.val(),
                this.ui.format_range_max.val()
            ]
        }
    }
});

module.exports = EnumOrdinal;
