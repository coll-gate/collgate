/**
 * @file accessionedit.js
 * @brief Accession item edit view
 * @author Frederic SCHERMA
 * @date 2016-12-09
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var AccessionModel = require('../models/accession');

var DisplayDescriptor = require('../../descriptor/widgets/displaydescriptor');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    template: require('../templates/accessionedit.html'),

    ui: {
        "descriptor": "tr.accession-descriptor",
        "cancel": "button.cancel",
        "apply": "button.apply"
    },

    events: {
        "click @ui.cancel": "onCancel",
        "click @ui.apply": "onApply",
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        var view = this;
        var model = this.model;

        $.each(this.ui.descriptor, function(index) {
            var el = $(this);

            var pi = el.attr('panel-index');
            var i = el.attr('index');
            var descriptorType = model.get('panels')[pi].descriptor_model.descriptor_model_types[i].descriptor_type;
            var format = descriptorType.format;

            var definesValues = false;
            var defaultValues = null;

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
            } else if (format.type === "boolean") {
                var select = $('<select data-width="100%"></select>');
                el.children('td.descriptor-value').append(select);

                select.selectpicker({container: 'body', style: 'btn-default'});

                DisplayDescriptor.initBoolean(
                    format,
                    view,
                    select,
                    view.definesValues,
                    view.defaultValues);
            } else if (format.type === "ordinal") {
                var select = $('<select data-width="100%"></select>');
                el.children('td.descriptor-value').append(select);

                select.selectpicker({container: 'body', style: 'btn-default'});

                DisplayDescriptor.initOrdinal(
                    format,
                    view,
                    select,
                    view.definesValues,
                    view.defaultValues);
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
                    view.definesValues,
                    view.defaultValues);
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
                    view.definesValues,
                    view.defaultValues);
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
                    view.definesValues,
                    view.defaultValues);
            } else {
                var group = $('<div class="input-group"></div>');
                var input = $('<input class="form-control" width="100%">');
                var glyph = $('<span class="input-group-addon"><span class="glyphicon glyphicon-cog"></span></span>');
                group.append(input);
                group.append(glyph);

                if (format.type === "numeric" || format.type === "numeric_range" || format.type === "ordinal") {
                    DisplayDescriptor.initNumeric(
                        format,
                        view,
                        input,
                        view.definesValues,
                        view.defaultValues);
                } else if (format.type === "string") {
                    DisplayDescriptor.initText(
                        format,
                        view,
                        input,
                        view.definesValues,
                        view.defaultValues);
                }

                el.children('td.descriptor-value').append(group);
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
            var descriptorModelType = model.get('panels')[pi].descriptor_model.descriptor_model_types[i];
            var condition = descriptorModelType.condition;

            if (condition.defined) {
                var display = false;

                // search the target descriptor type for the condition
                var target = view.$el.find("tr.accession-descriptor[descriptor-model-type=" + condition.target + "]");
                var targetDescriptorModelType = model.get('panels')[target.attr('panel-index')].descriptor_model.descriptor_model_types[target.attr('index')];
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
                            display = false;  // a boolean is always defined
                            break;
                        case 1:
                            display = true;  // a boolean is always defined
                            break;
                        case 2:
                            display = select.val() == condition.values[0];
                            break;
                        case 3:
                            display = select.val() != condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else if (format.type === "ordinal") {
                    var select = target.children('td.descriptor-value').children('div').children('select');
                    select.parent('div.bootstrap-select').on('changed.bs.select', $.proxy(view.onSelectChangeValue, view));

                    // initial condition
                    switch (condition.condition) {
                        case 0:
                            display = false;  // an ordinal is always defined
                            break;
                        case 1:
                            display = true;  // an ordinal is always defined
                            break;
                        case 2:
                            display = select.val() == condition.values[0];
                            break;
                        case 3:
                            display = select.val() != condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else if (format.type === "date") {
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
                } else if (format.type === "time") {
                    var input = target.children('td.descriptor-value').children('div.input-group').children('input.form-control');
                    //input.on('input', $.proxy(view.onInputChangeValue, view));
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
                } else if (format.type === "datetime") {
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
        var targetDescriptorModelType = this.model.get('panels')[pi].descriptor_model.descriptor_model_types[i];

        // find el from target
        var descriptorModelTypes = this.model.get('panels')[pi].descriptor_model.descriptor_model_types;
        for (var i = 0; i < descriptorModelTypes.length; ++i) {
            if (descriptorModelTypes[i].condition.target === targetDescriptorModelType.id) {
                var descriptorModelType = descriptorModelTypes[i];

                return {
                    descriptorModelType: descriptorModelType,
                    el: this.$el.find("tr.accession-descriptor[descriptor-model-type=" + descriptorModelType.id + "]")
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

        // initial condition
        switch (condition.condition) {
            case 0:
                display = input.val() === "" || input.val() === "undefined";
                break;
            case 1:
                display = input.val() !== "";
                break;
            case 2:
                display = input.val() === condition.values[0];
                break;
            case 3:
                display = input.val() !== condition.values[0];
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

    onCancel: function () {
        Backbone.history.navigate('app/home/', {trigger: true, replace: true});
    },

    onApply: function () {
        Backbone.history.navigate('app/accession/accession/' + this.model.get('id') + '/', {trigger: true, replace: true});
    },
});

module.exports = View;
