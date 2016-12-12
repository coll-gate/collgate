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

            var url = application.baseUrl + 'descriptor/group/' + descriptorType.group + '/type/' + descriptorType.id + '/';

            if (format.type.startsWith('enum_')) {
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

                el.children('td.descriptor-value').append(group);
                
                // @todo validator
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
                        select.on("select2:select", view.onAutocompleteChangeValue);
                    } else {
                        var select = target.children('td.descriptor-value').children('div').children('select');
                        select.parent('div.bootstrap-select').on('changed.bs.select', view.onSelectChangeValue);

                        switch (condition.condition) {
                            case 0:
                                break;
                            case 1:
                                break;
                            case 2:
                                break;
                            case 3:
                                break;
                            default:
                                break;
                        }
                    }
                } else if (format.type === "boolean") {
                    var select = target.children('td.descriptor-value').children('div').children('select');
                    select.parent('div.bootstrap-select').on('changed.bs.select', view.onSelectChangeValue);

                    switch (condition.condition) {
                        case 0:
                            display = true;  // a boolean is always defines
                            break;
                        case 1:
                            display = false;  // a boolean is always defines
                            break;
                        case 2:
                            display = select.val() == condition.values[0];
                            break;
                        case 3:
                            display = select.val()!== condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else if (format.type === "ordinal") {
                    var select = target.children('td.descriptor-value').children('div').children('select');
                    select.parent('div.bootstrap-select').on('changed.bs.select', view.onSelectChangeValue);

                } else if (format.type === "date") {
                    var input = target.children('td.descriptor-value').children('div.input-group').children('input.form-control');
                } else if (format.type === "time") {
                    var input = target.children('td.descriptor-value').children('div.input-group').children('input.form-control');
                } else if (format.type === "datetime") {
                    var input = target.children('td.descriptor-value').children('div.input-group').children('input.form-control');
                } else {
                    var input = target.children('td.descriptor-value').children('div.input-group').children('input.form-control');
                }

                if (!display) {
                    el.hide(false);
                }
            }
        });
    },

    onAutocompleteChangeValue: function(e) {
        alert(e);
    },

    onSelectChangeValue: function(e) {
        alert(e);
    },

    onCancel: function () {
        Backbone.history.navigate('app/home/', {trigger: true, replace: true});
    },

    onApply: function () {
        Backbone.history.navigate('app/accession/accession/' + this.model.get('id') + '/', {trigger: true, replace: true});
    },
});

module.exports = View;
