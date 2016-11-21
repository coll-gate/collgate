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
        name: '#descriptor_type_name',
        code: '#descriptor_type_code',
        description: '#descriptor_type_description',
        format_type: '#format_type',
        format_trans: "#format_trans",
        fields: 'div.descriptor-type-fields',
        field0: '#type_field0',
        field1: '#type_field1',
        format_unit: '#format_unit',
        format_unit_custom: '#format_unit_custom',
        format_precision: '#format_precision',
        format_model: '#format_model',
        type_fields_info: 'div.descriptor-type-fields-info',
        sortby_field: '#sortby_field',
        display_fields: '#display_fields',
        type_fields_list: 'div.descriptor-type-fields-list',
        helper_display_fields: '#helper_display_fields',
        list_type: '#list_type',
        search_field: '#search_field',
        range: 'div.descriptor-type-range',
        format_range_min: '#format_range_min',
        format_range_max: '#format_range_max',
        format_regexp: '#format_regexp',
        save: '#save'
    },

    events: {
        'click @ui.save': 'saveDescriptorType',
        'input @ui.name': 'inputName',
        'change @ui.format_type': 'changeFormatType',
        'change @ui.format_unit': 'changeFormatUnit',
        'change @ui.list_type': 'changeListType',
        'input @ui.format_unit_custom': 'inputFormatUnitCustom',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        application.descriptor.views.describables.drawSelect(this.ui.format_model);

        $(this.ui.format_trans).selectpicker({style: 'btn-default', container: 'body'});
        $(this.ui.format_type).selectpicker({style: 'btn-default', container: 'body'});
        $(this.ui.format_unit).selectpicker({style: 'btn-default', container: 'body'});
        $(this.ui.format_precision).selectpicker({style: 'btn-default', container: 'body'});

        $(this.ui.sortby_field).selectpicker({style: 'btn-default'});
        $(this.ui.display_fields).selectpicker({style: 'btn-default'});
        $(this.ui.list_type).selectpicker({style: 'btn-default'});
        $(this.ui.search_field).selectpicker({style: 'btn-default'});

        // @todo check user permissions
        if (!this.model.get('can_modify')) {
            $(this.ui.save).hide();
        }

        var format = this.model.get('format');

        $(this.ui.format_type).val(format.type).trigger('change');
        $(this.ui.format_unit).val(format.unit).trigger('change');
        $(this.ui.format_precision).val(format.precision).trigger('change');

        if (format.trans) {
            $(this.ui.format_trans).val("true");
        } else {
            $(this.ui.format_trans).val("false");
        }

        switch (format.type) {
            case "enum_single":
            case "enum_pair":
            case "enum_ordinal":
                this.ui.sortby_field.val(format.sortby_field).trigger('change');
                this.ui.display_fields.val(format.display_fields).trigger('change');
                this.ui.list_type.val(format.list_type).trigger('change');
                this.ui.search_field.val(format.search_field).trigger('change');
                break;
            default:
                this.ui.format_trans.parent().parent().hide(false);
                this.ui.type_fields_info.hide(false);
                this.ui.type_fields_list.hide(false);
                break;
        }

        if (format.type == "enum_pair") {
            $(this.ui.fields).show();

            if (format.fields[0]) {
                $(this.ui.field0).val(format.fields[0]);
            }
            if (format.fields[1]) {
                $(this.ui.field1).val(format.fields[1]);
            }
        } else {
            $(this.ui.fields).hide(false);

            $(this.ui.field0).val("");
            $(this.ui.field1).val("");
        }

        switch (format.type) {
            case "ordinal":
            case "enum_ordinal":
                $(this.ui.format_range_min).numeric({decimal: false, negative: false});
                $(this.ui.format_range_max).numeric({decimal: false, negative: false});

                $(this.ui.format_range_min).val(format.range[0]);
                $(this.ui.format_range_max).val(format.range[1]);
                break;
            case "numeric_range":
                $(this.ui.format_range_min).numeric({decimal: '.', negative: false});
                $(this.ui.format_range_max).numeric({decimal: '.', negative: false});

                $(this.ui.format_range_min).val(format.range[0]);
                $(this.ui.format_range_max).val(format.range[1]);
                break;
            default:
                $(this.ui.format_range_min).attr("readonly", "readonly").val("");
                $(this.ui.format_range_max).attr("readonly", "readonly").val("");

                if ($(this.ui.range).css('display') != 'none') {
                    $(this.ui.range).hide(false);
                }
                break;
        }

        switch (format.type) {
            case "boolean":
            case "gps":
            case "date":
            case "time":
            case "datetime":
            case "ordinal":
            case "entity":
                $(this.ui.format_unit_custom).attr("disabled", "disabled").val("");
                if ($(this.ui.format_unit).closest("div.form-group").css('display') != 'none') {
                    $(this.ui.format_unit).closest("div.form-group").hide(false);
                }
                break;
            default:
                break;
        }

        if (format.type != "entity") {
            if ($(this.ui.format_model).closest("div.form-group").css('display') != 'none') {
                $(this.ui.format_model).closest("div.form-group").hide(false);
            }
        }

        if (format.type != "numeric" && format.type != "numeric_range") {
            if ($(this.ui.format_precision).closest("div.form-group").css('display') != 'none') {
                $(this.ui.format_precision).closest("div.form-group").hide(false);
            }
        }

        if (format.type != "string") {
            if ($(this.ui.format_regexp).closest("div.form-group").css('display') != 'none') {
                $(this.ui.format_regexp).closest("div.form-group").hide(false);
            }
        }
    },

    onShow: function() {
        $(this.ui.helper_display_fields).makePopover();
    },

    changeFormatType: function () {
        var type = $(this.ui.format_type).val();

        // related fields
        switch (type) {
            case "boolean":
            case "gps":
            case "string":
            case "ordinal":
            case "entity:":
            case "date":
            case "time":
            case "datetime":
            case "enum_single":
            case "enum_pair":
            case "enum_ordinal":
                $(this.ui.format_precision).attr("disabled", "disabled").val("0.0");
                if ($(this.ui.format_precision).closest("div.form-group").css('display') != 'none') {
                    $(this.ui.format_precision).closest("div.form-group").hide(true);
                }
                break;
            case "numeric":
            case "numeric_range":
                $(this.ui.format_precision).attr("disabled", null).val("1.0");
                if ($(this.ui.format_precision).closest("div.form-group").css('display') == 'none') {
                    $(this.ui.format_precision).closest("div.form-group").show(true);
                }
                break;
            default:
                break;
        }

        switch (type) {
            case "boolean":
            case "gps":
            case "date":
            case "time":
            case "datetime":
            case "ordinal":
            case "entity":
                $(this.ui.format_unit_custom).attr("disabled", "disabled").val("");
                if ($(this.ui.format_unit).closest("div.form-group").css('display') != 'none') {
                    $(this.ui.format_unit).closest("div.form-group").hide(true);
                }
                break;
            default:
                $(this.ui.format_unit_custom).removeAttr("disabled").val("");
                if ($(this.ui.format_unit).closest("div.form-group").css('display') == 'none') {
                    $(this.ui.format_unit).closest("div.form-group").show(true);
                }
                break;
        }

        switch (type) {
            case "enum_single":
            case "enum_pair":
            case "enum_ordinal":
                if (this.ui.format_trans.parent().parent().css('display') == 'none') {
                    $(this.ui.format_trans).parent().parent().show(true);
                }

                if (this.ui.type_fields_list.css('display') == 'none') {
                    this.ui.type_fields_info.show(true);
                    this.ui.type_fields_list.show(true);
                }
                break;
            default:
                if (this.ui.format_trans.parent().parent().css('display') != 'none') {
                    $(this.ui.format_trans).parent().parent().hide(true);
                }

                if (this.ui.type_fields_list.css('display') != 'none') {
                    this.ui.type_fields_info.hide(true);
                    this.ui.type_fields_list.hide(true);
                }
                break;
        }

        if (type == "string") {
            $(this.ui.format_regexp).attr("readonly", null).val("");

            if ($(this.ui.format_regexp).closest("div.form-group").css('display') == 'none') {
                $(this.ui.format_regexp).closest("div.form-group").show(true);
            }
        } else {
            $(this.ui.format_regexp).attr("readonly", "readonly").val("");

            if ($(this.ui.format_regexp).closest("div.form-group").css('display') != 'none') {
                $(this.ui.format_regexp).closest("div.form-group").hide(true);
            }
        }

        if (type == "numeric_range") {
            $(this.ui.format_range_min).attr("readonly", null).val("0.0").numeric({decimal : '.', negative : false});
            $(this.ui.format_range_max).attr("readonly", null).val("100.0").numeric({decimal : '.', negative : false});

            if ($(this.ui.range).css('display') == 'none') {
                $(this.ui.range).show(true);
            }
        } else if (type == "enum_ordinal" || type == "ordinal") {
            $(this.ui.format_range_min).attr("readonly", null).val("0").numeric({decimal : false, negative : false});
            $(this.ui.format_range_max).attr("readonly", null).val("10").numeric({decimal : false, negative : false});

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

        if (type == "entity") {
            if ($(this.ui.format_model).closest("div.form-group").css('display') == 'none') {
                $(this.ui.format_model).closest("div.form-group").show(true);
            }
        } else {
            if ($(this.ui.format_model).closest("div.form-group").css('display') != 'none') {
                $(this.ui.format_model).closest("div.form-group").hide(true);
            }
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

    changeListType: function () {
        var listType = $(this.ui.list_type).val();

        switch (listType) {
            case "dropdown":
                $(this.ui.search_field).parent().find('.dropdown-toggle').prop('disabled', true);
                $(this.ui.search_field).parent().find("div.dropdown-menu ul li:first-child a").trigger("click");
                //$(this.ui.search_field).attr("disabled", "disabled").val("value0");
                break;
            default:
                $(this.ui.search_field).parent().find('.dropdown-toggle').prop('disabled', false);
                break;
        }
    },
    
    inputFormatUnitCustom: function () {
        var v = this.ui.format_unit_custom.val();
        var re = /^[a-zA-Z0-9_\-%°⁼⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹/µ]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.format_unit_custom).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _-°%°⁼⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹/µ allowed)"));
        } else if (v.length < 1) {
            $(this.ui.format_unit_custom).validateField('failed', gt.gettext('1 character min'));
        } else {
            $(this.ui.format_unit_custom).validateField('ok');
        }
    },

    inputName: function () {
        var v = this.ui.name.val();
        var re = /^[a-zA-Z0-9_-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
        } else if (v.length < 3) {
            $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
        } else {
            $(this.ui.name).validateField('ok');
        }
    },

    saveDescriptorType: function () {
        if (!$(this.ui.name.isValidField()))
            return;

        var name = this.ui.name.val();
        var code = this.ui.code.val();
        var description = this.ui.description.val();
        var trans = this.ui.format_trans.val() == "true";

        var format = {
            type: this.ui.format_type.val(),
            unit: this.ui.format_unit.val(),
            precision: this.ui.format_precision.val(),
            fields: [],
            trans: trans
        };

        var field0 = this.ui.field0.val();
        var field1 = this.ui.field1.val();

        if (field0 && field1) {
            format.fields = [field0, field1];
        }

        if (format.unit == 'custom') {
            format.custom_unit = this.ui.format_unit_custom.val();
        }

        if (format.type == 'entity') {
            format.model = this.ui.format_model.val();
            format.custom_unit = "";
        }

        if (format.type == 'numeric_range' ||
            format.type == 'enum_ordinal' ||
            format.type == 'ordinal') {

            format.range = [
                this.ui.format_range_min.val(),
                this.ui.format_range_max.val()
            ];
        }

        if (format.type == 'string') {
            format.regexp = this.ui.format_regexp.val();
        }

        if (format.type == 'enum_pair') {
            format.sortby_field = this.ui.sortby_field.val();
            format.display_fields = this.ui.display_fields.val();
            format.list_type = this.ui.list_type.val();
            format.search_field = this.ui.search_field.val();
        } else if (format.type == 'enum_single') {
            format.sortby_field = 'value0';
            format.display_fields = 'value0';
            format.list_type = this.ui.list_type.val();
            format.search_field = 'value0';
        } else if (format.type == 'enum_ordinal') {
            format.sortby_field = 'ordinal';
            format.display_fields = this.ui.display_fields.val();
            format.list_type = 'dropdown';
            format.search_field = 'value0';
        }

        this.model.save({
            name: name,
            code: code,
            format: format,
            description: description,
        }, {wait: true}).done(function() {
            $.alert.success(gt.gettext("Done"));
        });
    }
});

module.exports = View;
