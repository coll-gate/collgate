/**
 * @file descriptortypedetail.js
 * @brief Detail for a type of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-07-29
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorTypeModel = require('../models/descriptortype');

var View = Marionette.ItemView.extend({
    className: 'element object descriptor-type-detail',
    template: require('../templates/descriptortypedetail.html'),

    ui: {
        delete_descriptor_type: 'span.delete-descriptor-type',
        view_descriptor_type: 'td.view-descriptor-type',
        view_descriptor_value: 'td.view-descriptor-value',
        target: '#target',
        name: '#descriptor_type_name',
        format_type: '#format_type',
        fields: 'div.descriptor-type-fields',
        field0: '#type_field0',
        field1: '#type_field1',
        format_unit: '#format_unit',
        format_unit_custom: '#format_unit_custom',
        format_precision: '#format_precision',
        range: 'div.descriptor-type-range',
        format_range_min: '#format_range_min',
        format_range_max: '#format_range_max',
        format_regexp: '#format_regexp'
    },

    events: {
        'click @ui.delete_descriptor_type': 'deleteDescriptorType',
        'click @ui.view_descriptor_type': 'viewDescriptorType',
        'click @ui.view_descriptor_value': 'viewDescriptorValue',
        'change @ui.format_type': 'changeFormatType',
        'change @ui.format_unit': 'changeFormatUnit',
        'input @ui.format_unit_custom': 'inputFormatUnitCustom',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);

        $(this.ui.format_type).select2({
            dropdownParent: $(this.el),
        });
    },

    onRender: function() {
        var format = this.model.get('format');

        $(this.ui.format_type).val(format.type).trigger('change');
        $(this.ui.format_unit).val(format.unit).trigger('change');
        $(this.ui.format_precision).val(format.precision).trigger('change');

        if (format.fields && format.fields.length >= 2) {
            $(this.ui.field0).val(format.fields[0]);
            $(this.ui.field1).val(format.fields[1]);
        } else {
            $(this.ui.fields).hide(false);

            $(this.ui.field0).val("");
            $(this.ui.field1).val("");
        }

        if (format.type != "numeric_range") {
            $(this.ui.format_range_min).attr("readonly", "readonly").val("");
            $(this.ui.format_range_max).attr("readonly", "readonly").val("");

            if ($(this.ui.range).css('display') != 'none') {
                $(this.ui.range).hide(false);
            }
        }

        if (format.type != "numeric" && format.type != "numeric_range") {
            if ($(this.ui.format_precision).parent().css('display') != 'none') {
                $(this.ui.format_precision).parent().hide(false);
            }
        }

        if (format.type != "string") {
            if ($(this.ui.format_regexp).parent().css('display') != 'none') {
                $(this.ui.format_regexp).parent().hide(false);
            }
        }
    },

    changeFormatType: function () {
        var type = $(this.ui.format_type).val();

        // related fields
        switch (type) {
            case "boolean":
            case "gps":
            case "string":
            case "enum_single":
            case "enum_pair":
            case "enum_ordinal_text":
            case "ordinal":
                $(this.ui.format_precision).attr("disabled", "disabled").val("0.0");
                if ($(this.ui.format_precision).parent().css('display') != 'none') {
                    $(this.ui.format_precision).parent().hide(true);
                }
                break;
            case "numeric":
            case "numeric_range":
                $(this.ui.format_precision).attr("disabled", null).val("1.0");
                if ($(this.ui.format_precision).parent().css('display') == 'none') {
                    $(this.ui.format_precision).parent().show(true);
                }
                break;
            default:
                break;
        }

        if (type == "string") {
            $(this.ui.format_regexp).attr("readonly", null).val("");

            if ($(this.ui.format_regexp).parent().css('display') == 'none') {
                $(this.ui.format_regexp).parent().show(true);
            }
        } else {
            $(this.ui.format_regexp).attr("readonly", "readonly").val("");

            if ($(this.ui.format_regexp).parent().css('display') != 'none') {
                $(this.ui.format_regexp).parent().hide(true);
            }
        }

        if (type =="numeric_range") {
            $(this.ui.format_range_min).attr("readonly", null).val("0.0");
            $(this.ui.format_range_max).attr("readonly", null).val("100.0");

            if ($(this.ui.range).css('display') == 'none') {
                $(this.ui.range).show(true);
            }
        } else {
            $(this.ui.format_range_min).attr("readonly", "readonly").val("");
            $(this.ui.format_range_max).attr("readonly", "readonly").val("");

            if ($(this.ui.range).css('display') != 'none') {
                $(this.ui.range).hide(true);
            }
        }

        if (type == "enum_pair" && ($(this.ui.fields).css('display') == 'none')) {
            $(this.ui.fields).show(true);
        } else {
            $(this.ui.fields).hide(true);
        }
    },
    
    changeFormatUnit: function () {
        var unit = $(this.ui.format_unit).val();

        switch (unit) {
            case "custom":
                $(this.ui.format_unit_custom).attr("readonly", null).val("");
                break;
            default:
                $(this.ui.format_unit_custom).attr("readonly", "readonly").val("");
                break;
        }
    },
    
    inputFormatUnitCustom: function () {
        var v = this.ui.format_unit_custom.val();
        var re = /^[a-zA-Z0-9_\-%°⁼⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹/µ]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.format_unit_custom).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _-°%²³⁴⁵⁶⁷⁸⁹⁰ allowed)"));
        } else if (v.length < 1) {
            $(this.ui.format_unit_custom).validateField('failed', gt.gettext('1 character min'));
        } else {
            $(this.ui.format_unit_custom).validateField('ok');
        }
    }
});

module.exports = View;
