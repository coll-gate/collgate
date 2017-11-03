/**
 * @file enumpair.js
 * @brief Display and manage a list of pair values format of type of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let EnumSingle = require('./enumsingle');
let Marionette = require('backbone.marionette');

let Popover = require('../../main/behaviors/popover');

let EnumPair = function() {
    EnumSingle.call(this);

    this.name = "enum_pair";
    this.group = "list";
    this.allow_multiple = true
};

_.extend(EnumPair.prototype, EnumSingle.prototype, {});

EnumPair.DescriptorTypeDetailsView = Marionette.View.extend({
    className: 'descriptor-type-details-format',
    template: require('../templates/widgets/enumpair.html'),

    ui: {
        format_trans: "#format_trans",
        field0: '#type_field0',
        field1: '#type_field1',
        sort_by_field: '#sort_by_field',
        display_fields: '#display_fields',
        search_field: '#search_field',
        list_type: '#list_type'
    },

    events: {
        'change @ui.list_type': 'changeListType'
    },

    behaviors: {
        Popover: {
            behaviorClass: Popover
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        this.ui.format_trans.selectpicker({style: 'btn-default'});

        this.ui.sort_by_field.selectpicker({style: 'btn-default'});
        this.ui.list_type.selectpicker({style: 'btn-default'});
        this.ui.display_fields.selectpicker({style: 'btn-default'});
        this.ui.search_field.selectpicker({style: 'btn-default'});

        let format = this.model.get('format');

        if (format.trans) {
            this.ui.format_trans.val("true").selectpicker('refresh');
        } else {
            this.ui.format_trans.val("false").selectpicker('refresh');
        }

        if (format.fields != undefined) {
            if (format.fields.length >= 1)
                this.ui.field0.val(format.fields[0]);

            if (format.fields.length >= 2)
                this.ui.field1.val(format.fields[1]);
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
        let listType = this.ui.list_type.val();

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
            'fields': [this.ui.field0.val(), this.ui.field1.val()],
            'sortby_field': this.ui.sort_by_field.val(),
            'display_fields': this.ui.display_fields.val(),
            'list_type': this.ui.list_type.val(),
            'search_field': this.ui.search_field.val(),
        }
    }
});

module.exports = EnumPair;
