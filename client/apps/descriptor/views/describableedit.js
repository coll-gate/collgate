    /**
 * @file describableedit.js
 * @brief Describable entity item edit view
 * @author Frederic SCHERMA
 * @date 2016-12-15
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var ItemView = require('../../main/views/itemview');
var DisplayDescriptor = require('../widgets/displaydescriptor');

var View = ItemView.extend({
    tagName: 'div',
    template: require('../templates/describableedit.html'),
    templateHelpers: function () {
        return {
            panels: this.descriptorMetaModelLayout.panels,
            target: this.descriptorMetaModelLayout.target
        };
    },

    ui: {
        "descriptor": "tr.descriptor",
        "cancel": "button.cancel",
        "apply": "button.apply"
    },

    events: {
        "click @ui.cancel": "onCancel",
        "click @ui.apply": "onApply",
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        this.descriptorMetaModelLayout = options.descriptorMetaModelLayout;

        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        var view = this;
        var model = this.model;
        var exists = !model.isNew();

        $.each(this.ui.descriptor, function(index) {
            var el = $(this);

            var pi = el.attr('panel-index');
            var i = el.attr('index');
            var descriptorModelType = view.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
            var descriptorType = descriptorModelType.descriptor_type;
            var format = descriptorType.format;

            var definesValues = false;
            var defaultValues = null;

            // default value or current descriptor value
            if (exists) {
                defaultValues = [model.get('descriptors')[descriptorModelType.id]];
            } else {
                // @todo default value
            }

            if (format.type.startsWith('enum_')) {
                var url = application.baseUrl + 'descriptor/group/' + descriptorType.group + '/type/' + descriptorType.id + '/';

                if (format.list_type == "autocomplete") {
                    var select = $('<select style="width: 100%;"></select>');
                    el.children('td.descriptor-value').append(select);

                    DisplayDescriptor.initAutocomplete(
                        format,
                        url,
                        view,
                        select,
                        definesValues,
                        defaultValues);

                    if (descriptorModelType.set_once && exists) {
                        select.prop("disabled", true);
                    }
                } else {
                    var select = $('<select data-width="100%"></select>');
                    el.children('td.descriptor-value').append(select);

                    select.selectpicker({container: 'body', style: 'btn-default'});

                    DisplayDescriptor.initDropdown(
                        format,
                        url,
                        view,
                        select,
                        definesValues,
                        defaultValues);

                    if (descriptorModelType.set_once && exists) {
                        select.prop("disabled", true).selectpicker('refresh');
                    }
                }
            } else if (format.type == "entity") {
                var url = application.baseUrl + format.model.replace('.', '/') + '/';

                var select = $('<select style="width: 100%;"></select>');
                el.children('td.descriptor-value').append(select);

                DisplayDescriptor.initEntitySelect(
                    format,
                    url,
                    view,
                    select,
                    definesValues,
                    defaultValues);

                if (descriptorModelType.set_once && exists) {
                    select.prop("disabled", true);
                }
            } else if (format.type === "boolean") {
                var select = $('<select data-width="100%"></select>');
                el.children('td.descriptor-value').append(select);

                select.selectpicker({container: 'body', style: 'btn-default'});

                DisplayDescriptor.initBoolean(
                    format,
                    view,
                    select,
                    definesValues,
                    defaultValues);

                if (descriptorModelType.set_once && exists) {
                    select.prop("disabled", true).selectpicker('refresh');
                }
            } else if ((format.type === "ordinal") && ((format.range[1] - format.range[0] + 1) <= 256)) {
                // ordinal with at max 256 values as a dropdown
                var select = $('<select data-width="100%"></select>');
                el.children('td.descriptor-value').append(select);

                select.selectpicker({container: 'body', style: 'btn-default'});

                DisplayDescriptor.initOrdinal(
                    format,
                    view,
                    select,
                    definesValues,
                    defaultValues);

                if (descriptorModelType.set_once && exists) {
                    select.prop("disabled", true).selectpicker('refresh');
                }
            } else if (format.type === "date") {
                var group = $('<div class="input-group"></div>');
                var input = $('<input class="form-control" width="100%">');
                var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>').css('cursor', 'pointer');
                group.append(input);
                group.append(glyph);

                el.children('td.descriptor-value').append(group);

                DisplayDescriptor.initDate(
                    format,
                    view,
                    group,
                    definesValues,
                    defaultValues);

                if (descriptorModelType.set_once && exists) {
                    group.data('DateTimePicker').disable();
                }
            } else if (format.type === "time") {
                var group = $('<div class="input-group"></div>');
                var input = $('<input class="form-control" width="100%">');
                var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-time"></span></span>').css('cursor', 'pointer');
                group.append(input);
                group.append(glyph);

                el.children('td.descriptor-value').append(group);

                DisplayDescriptor.initTime(
                    format,
                    view,
                    group,
                    definesValues,
                    defaultValues);

                if (descriptorModelType.set_once && exists) {
                    group.data('DateTimePicker').disable();
                }
            } else if (format.type === "datetime") {
                var group = $('<div class="input-group"></div>');
                var input = $('<input class="form-control" width="100%">');
                var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>').css('cursor', 'pointer');
                group.append(input);
                group.append(glyph);

                el.children('td.descriptor-value').append(group);

                DisplayDescriptor.initDateTime(
                    format,
                    view,
                    group,
                    definesValues,
                    defaultValues);

                if (descriptorModelType.set_once && exists) {
                    group.data('DateTimePicker').disable();
                }
            } else {
                var group = $('<div class="input-group"></div>');
                var input = $('<input class="form-control" width="100%">');
                var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-cog"></span></span>');
                group.append(input);
                group.append(glyph);

                // numeric, numeric range, and ordinal with more than 256 values
                if (format.type === "numeric" || format.type === "numeric_range" || format.type === "ordinal") {
                    DisplayDescriptor.initNumeric(
                        format,
                        view,
                        input,
                        definesValues,
                        defaultValues);
                } else if (format.type === "string") { // regexp text
                    DisplayDescriptor.initText(
                        format,
                        view,
                        input,
                        definesValues,
                        defaultValues);
                }

                el.children('td.descriptor-value').append(group);

                if (descriptorModelType.set_once && exists) {
                    input.prop('disabled', true);
                }
            }
        });
    },

    onShow: function() {
        var view = this;
        var model = this.model;

        $.each(this.ui.descriptor, function(index) {
            var el = $(this);

            var pi = el.attr('panel-index');
            var i = el.attr('index');
            var descriptorModelType = view.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
            var condition = descriptorModelType.condition;

            if (condition.defined) {
                var display = false;

                // search the target descriptor type for the condition
                var target = view.$el.find("tr.descriptor[descriptor-model-type=" + condition.target + "]");
                var targetDescriptorModelType = view.descriptorMetaModelLayout.panels[target.attr('panel-index')].descriptor_model.descriptor_model_types[target.attr('index')];
                var format = targetDescriptorModelType.descriptor_type.format;

                if (format.type.startsWith('enum_')) {
                    if (format.list_type === "autocomplete") {
                        var select = target.children('td.descriptor-value').children('select');
                        select.on("select2:select", $.proxy(view.onAutocompleteChangeValue, view));

                        // initial condition
                        switch (condition.condition) {
                            case 0:
                                display = select.val() === "" || select.val() === "undefined";
                                break;
                            case 1:
                                display = select.val() !== "";
                                break;
                            case 2:
                                display = select.val() === condition.values[0];
                                break;
                            case 3:
                                display = select.val() !== condition.values[0];
                                break;
                            default:
                                break;
                        }
                    } else if (format.type === "entity") {
                        var select = target.children('td.descriptor-value').children('select');
                        select.on("select2:select", $.proxy(view.onAutocompleteChangeValue, view));

                        // initial condition
                        switch (condition.condition) {
                            case 0:
                                display = select.val() === "" || select.val() === "undefined";
                                break;
                            case 1:
                                display = select.val() !== "";
                                break;
                            case 2:
                                display = select.val() === condition.values[0];
                                break;
                            case 3:
                                display = select.val() !== condition.values[0];
                                break;
                            default:
                                break;
                        }
                    } else {
                        var select = target.children('td.descriptor-value').children('div').children('select');
                        select.parent('div.bootstrap-select').on('changed.bs.select', $.proxy(view.onSelectChangeValue, view));

                        // initial condition
                        switch (condition.condition) {
                            case 0:
                                display = select.val() === "" || select.val() === "undefined";
                                break;
                            case 1:
                                display = select.val() !== "";
                                break;
                            case 2:
                                display = select.val() === condition.values[0];
                                break;
                            case 3:
                                display = select.val() !== condition.values[0];
                                break;
                            default:
                                break;
                        }
                    }
                } else if (format.type === "boolean") {
                    var select = target.children('td.descriptor-value').children('div').children('select');
                    select.parent('div.bootstrap-select').on('changed.bs.select', $.proxy(view.onSelectChangeValue, view));

                    // initial condition
                    switch (condition.condition) {
                        case 0:
                            display = select.val() === "" || select.val() === "undefined";  // false;  // a boolean is always defined
                            break;
                        case 1:
                            display = select.val() !== "";  // true;  // a boolean is always defined
                            break;
                        case 2:
                            display = (select.val() === "true") === condition.values[0];
                            break;
                        case 3:
                            display = (select.val() === "true") !== condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else if (format.type === "ordinal") {
                    // max of 256 value (select)
                    if ((format.range[1] - format.range[0] + 1) <= 256) {
                        var select = target.children('td.descriptor-value').children('div').children('select');
                        select.parent('div.bootstrap-select').on('changed.bs.select', $.proxy(view.onSelectChangeValue, view));

                        // initial condition
                        switch (condition.condition) {
                            case 0:
                                display = select.val() === "" || select.val() === "undefined";  // false;  // an ordinal is always defined
                                break;
                            case 1:
                                display = select.val() !== "";  // true;  // an ordinal is always defined
                                break;
                            case 2:
                                display = parseInt(select.val()) === condition.values[0];
                                break;
                            case 3:
                                display = parseInt(select.val()) !== condition.values[0];
                                break;
                            default:
                                break;
                        }
                    } else {
                        // ordinal with more than 256 values => input
                        var input = target.children('td.descriptor-value').children('div.input-group').children('input.form-control');
                        input.on('input', $.proxy(view.onInputChangeValue, view));

                        // initial condition
                        switch (condition.condition) {
                            case 0:
                                display = select.val() === "" || select.val() === "undefined";  // false;  // an ordinal is always defined
                                break;
                            case 1:
                                display = select.val() !== "";  // true;  // an ordinal is always defined
                                break;
                            case 2:
                                display = parseInt(input.val()) === condition.values[0];
                                break;
                            case 3:
                                display = parseInt(select.val()) !== condition.values[0];
                                break;
                            default:
                                break;
                        }
                    }
                } else if (format.type === "date" || format.type === "time" || format.type === "datetime") {
                    var input = target.children('td.descriptor-value').children('div.input-group').children('input.form-control');
                    input.parent().on('dp.change', $.proxy(view.onDateChange, view));

                    // initial condition
                    switch (condition.condition) {
                        case 0:
                            display = input.val() == "";
                            break;
                        case 1:
                            display = input.val() != "";
                            break;
                        case 2:
                            display = select.val() === condition.values[0];
                            break;
                        case 3:
                            display = select.val() !== condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else {
                    // numeric, numeric range, text with regexp
                    var input = target.children('td.descriptor-value').children('div.input-group').children('input.form-control');
                    input.on('input', $.proxy(view.onInputChangeValue, view));

                    // initial condition
                    switch (condition.condition) {
                        case 0:
                            display = input.val() == "";
                            break;
                        case 1:
                            display = input.val() != "";
                            break;
                        case 2:
                            display = select.val() === condition.values[0];
                            break;
                        case 3:
                            display = select.val() !== condition.values[0];
                            break;
                        default:
                            break;
                    }
                }

                if (!display) {
                    el.hide(false);
                }
            }
        });
    },

    findDescriptorModelTypeForConditionTarget: function(target) {
        var pi = target.attr('panel-index');
        var i = target.attr('index');
        var targetDescriptorModelType = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];

        // find el from target
        var descriptorModelTypes = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types;
        for (var i = 0; i < descriptorModelTypes.length; ++i) {
            if (descriptorModelTypes[i].condition.target === targetDescriptorModelType.id) {
                var descriptorModelType = descriptorModelTypes[i];

                return {
                    targetDescriptorModelType: targetDescriptorModelType,
                    descriptorModelType: descriptorModelType,
                    el: this.$el.find("tr.descriptor[descriptor-model-type=" + descriptorModelType.id + "]")
                }
            }
        }

        return null;
    },

    onAutocompleteChangeValue: function(e) {
        var display = false;
        var select = $(e.target);

        var target = select.parent().parent();
        var source = this.findDescriptorModelTypeForConditionTarget(target);
        var condition = source.descriptorModelType.condition;

        var value = select.val();

        // cast to correct type if necessary
        if (source.targetDescriptorModelType.descriptor_type.format.type === "entity") {
            value = parseInt(select.val());
        }

        // initial condition
        switch (condition.condition) {
            case 0:
                display = select.val() === "" || select.val() === "undefined";
                break;
            case 1:
                display = select.val() !== "";
                break;
            case 2:
                display = value === condition.values[0];
                break;
            case 3:
                display = value !== condition.values[0];
                break;
            default:
                break;
        }

        if (display) {
            source.el.show(true);
        } else {
            source.el.hide(true);
        }
    },

    onSelectChangeValue: function(e) {
        var display = false;
        var select = $(e.target);

        var target = select.parent().parent().parent();
        var source = this.findDescriptorModelTypeForConditionTarget(target);
        var condition = source.descriptorModelType.condition;

        var value = select.val();

        // cast to correct type if necessary
        if (source.targetDescriptorModelType.descriptor_type.format.type === "boolean") {
            value = select.val() === "true";  // always defined
        } else if (source.targetDescriptorModelType.descriptor_type.format.type === "ordinal") {
            value = parseInt(select.val());  // always defines
        }

        // initial condition
        switch (condition.condition) {
            case 0:
                display = select.val() === "" || select.val() === "undefined";
                break;
            case 1:
                display = select.val() !== "";
                break;
            case 2:
                display = value === condition.values[0];
                break;
            case 3:
                display = value !== condition.values[0];
                break;
            default:
                break;
        }

        if (display) {
            source.el.show(true);
        } else {
            source.el.hide(true);
        }
    },

    onDateChange: function (e) {
        var display = false;
        var input = $(e.target);

        var target = input.parent().parent();
        var source = this.findDescriptorModelTypeForConditionTarget(target);
        var condition = source.descriptorModelType.condition;
        var date = input.data('DateTimePicker').date();

        var dateFormat = null;
        if (source.descriptorModelType.descriptor_type.format.type === "date" ) {
            // format to YYYYMMDD date
            dateFormat = "YYYYMMDD";
        } else if (source.descriptorModelType.descriptor_type.format.type === "time" ) {
            // format to HH:mm:ss time
            dateFormat = "HH:mm:ss";
        } else if (source.descriptorModelType.descriptor_type.format.type === "datetime" ) {
            // format to iso datetime
            dateFormat = null;
        }

        // initial condition
        switch (condition.condition) {
            case 0:
                display = date == null;
                break;
            case 1:
                display = date !== null;
                break;
            case 2:
                display = date != null && date.format(dateFormat) === condition.values[0];
                break;
            case 3:
                display = date != null && date.format(dateFormat) !== condition.values[0];
                break;
            default:
                break;
        }

        if (display) {
            source.el.show(true);
        } else {
            source.el.hide(true);
        }
    },

    onInputChangeValue: function(e) {
        var display = false;
        var input = $(e.target);

        var target = input.parent().parent().parent();
        var source = this.findDescriptorModelTypeForConditionTarget(target);
        var condition = source.descriptorModelType.condition;

        var value = select.val();

        // cast to correct type if necessary (numeric and numeric_range are read as usual string)
        if (source.targetDescriptorModelType.descriptor_type.format.type === "ordinal") {
            value = parseInt(input.val());  // always defines
        }

        // initial condition
        switch (condition.condition) {
            case 0:
                display = input.val() === "" || input.val() === "undefined";
                break;
            case 1:
                display = input.val() !== "";
                break;
            case 2:
                display = value === condition.values[0];
                break;
            case 3:
                display = value !== condition.values[0];
                break;
            default:
                break;
        }

        if (display) {
            source.el.show(true);
        } else {
            source.el.hide(true);
        }
    },

    prepareDescriptors: function () {
        var view = this;

        var descriptors = {};

        $.each(this.ui.descriptor, function(index) {
            var el = $(this);

            var pi = el.attr('panel-index');
            var i = el.attr('index');
            var descriptorModelType = view.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
            var mandatory = descriptorModelType.mandatory;

            var values = [null];

            if (el.css('display') !== "none") {
                // take value
                var format = descriptorModelType.descriptor_type.format;

                if ((format.type.startsWith('enum_') && format.list_type == "autocomplete") || (format.type === "entity")) {
                    values = [el.find('select').val()];
                } else if (format.list_type === "dropdown") {
                    values = [el.find('select').val()];
                } else if (format.type === 'boolean') {
                    values = [el.find('select').val() === "true"];
                } else if (format.type === 'ordinal') {
                    // max 256 values for a dropdown
                    if ((format.range[1] - format.range[0] + 1) <= 256) {
                        values = [parseInt(el.find('select').val())];
                    } else {
                        values = [parseInt(el.find('input').val())];
                    }
                } else if (format.type === "date") {
                    // format to YYYYMMDD date
                    values = [el.find('input').parent().data('DateTimePicker').viewDate().format("YYYYMMDD")];
                } else if (format.type === "time") {
                    // format to HH:mm:ss time
                    values = [el.find('input').parent().data('DateTimePicker').viewDate().format("HH:mm:ss")]; // .MS
                } else if (format.type === "datetime") {
                    // format to iso datetime
                    values = [el.find('input').parent().data('DateTimePicker').viewDate().format()];
                } else if (format.type === "string") {
                    // text (already validated)
                    values = [el.find('input').val()];
                } else if (format.type === "numeric") {
                    // numeric, text (already validated)
                    values = [el.find('input').val()];
                } else {
                    // ???
                    values = [el.find('input').val()];
                }
            }

            if (mandatory && values[0] === null) {
                $.alert.error(gt.gettext("Field " + descriptorModelType.label + " is required"));
                return null;
            }

            descriptors[descriptorModelType.id] = values[0];
        });

        return descriptors;
    },

    onCancel: function () {
        Backbone.history.navigate('app/home/', {trigger: true, replace: true});
    }
});

module.exports = View;
