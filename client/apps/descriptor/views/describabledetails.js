/**
 * @file describabledetails.js
 * @brief Describable entity details item view
 * @author Frederic SCHERMA
 * @date 2016-12-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var ItemView = require('../../main/views/itemview');
var DisplayReadDescriptor = require('../widgets/displayreaddescriptor');

var View = ItemView.extend({
    tagName: 'div',
    template: require('../templates/describabledetails.html'),
    templateHelpers: function () {
        return {
            panels: this.descriptorMetaModelLayout.panels,
            target: this.descriptorMetaModelLayout.target
        };
    },

    ui: {
        "descriptor": "tr.descriptor",
        "modify": "button.modify"
    },

    events: {
        "click @ui.modify": "onModify"
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        this.descriptorMetaModelLayout = options.descriptorMetaModelLayout;

        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        var view = this;
        var model = this.model;
        var descriptors = model.get('descriptors');

        $.each(this.ui.descriptor, function(index) {
            var el = $(this);

            var pi = el.attr('panel-index');
            var i = el.attr('index');
            var descriptorModelType = view.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
            var descriptorType = descriptorModelType.descriptor_type;
            var format = descriptorType.format;

            values = [model.get('descriptors')[descriptorModelType.id]];

            // @todo remove me once migration done
            /*if (format.type.startsWith('enum_')) {
                var url = application.baseUrl + 'descriptor/group/' + descriptorType.group + '/type/' + descriptorType.id + '/';

                if (format.list_type == "autocomplete") {
                    var group = el.children('td.descriptor-value').children('div.input-group');
                    group.children('span').children('span').addClass('glyphicon-list');

                    DisplayReadDescriptor.initAutocomplete(
                        format,
                        url,
                        view,
                        group,
                        true,
                        values);
                } else {
                    var group = el.children('td.descriptor-value').children('div.input-group');
                    group.children('span').children('span').addClass('glyphicon-list');

                    DisplayReadDescriptor.initDropdown(
                        format,
                        url,
                        view,
                        group,
                        true,
                        values);
                }
            } else if (format.type == "entity") {
                var url = application.baseUrl + format.model.replace('.', '/') + '/';

                var group = el.children('td.descriptor-value').children('div.input-group');
                group.children('span').children('span').addClass('glyphicon-share');

                DisplayReadDescriptor.initEntitySelect(
                    format,
                    url,
                    view,
                    group,
                    true,
                    values);
            } else if (format.type === "boolean") {
                var group = el.children('td.descriptor-value').children('div.input-group');

                if (values[0]) {
                    group.children('span').children('span').addClass('glyphicon-check');
                } else {
                    group.children('span').children('span').addClass('glyphicon-unchecked');
                }

                DisplayReadDescriptor.initBoolean(
                    format,
                    view,
                    group,
                    true,
                    values);
            } else if ((format.type === "ordinal") && ((format.range[1] - format.range[0] + 1) <= 256)) {
                // ordinal with at max 256 values as a dropdown
                var group = el.children('td.descriptor-value').children('div.input-group');
                group.children('span').children('span').addClass('glyphicon-option-vertical');

                DisplayReadDescriptor.initOrdinal(
                    format,
                    view,
                    group,
                    true,
                    values);
            } else if (format.type === "date") {
                var group = el.children('td.descriptor-value').children('div.input-group');
                group.children('span').children('span').addClass('glyphicon-calendar');

                DisplayReadDescriptor.initDate(
                    format,
                    view,
                    group,
                    true,
                    values);
            } else if (format.type === "time") {
                var group = el.children('td.descriptor-value').children('div.input-group');
                group.children('span').children('span').addClass('glyphicon-time');

                DisplayReadDescriptor.initTime(
                    format,
                    view,
                    group,
                    true,
                    values);
            } else if (format.type === "datetime") {
                var group = el.children('td.descriptor-value').children('div.input-group');
                group.children('span').children('span').addClass('glyphicon-calendar');

                DisplayReadDescriptor.initDateTime(
                    format,
                    view,
                    group,
                    true,
                    values);
            } else {
                var group = el.children('td.descriptor-value').children('div.input-group');
                group.children('span').children('span').addClass('glyphicon-cog');

                // numeric, numeric range, and ordinal with more than 256 values
                if (format.type === "numeric" || format.type === "numeric_range" || format.type === "ordinal") {
                    DisplayReadDescriptor.initNumeric(
                        format,
                        view,
                        group,
                        true,
                        values);
                } else if (format.type === "string") { // regexp text
                    DisplayReadDescriptor.initText(
                        format,
                        view,
                        group,
                        true,
                        values);
                }
            } else*/ {
                // el.children('td.descriptor-value').children('div.input-group').remove(); // @todo remove me

                var widget = application.descriptor.widgets.newElement(format.type);
                widget.create(format, el.children('td.descriptor-value'), true, true, descriptorType.group, descriptorType.id);
                widget.set(format, true, values, descriptorType.group, descriptorType.id);

                // save the descriptor format type widget instance
                descriptorModelType.widget = widget;
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

                values = [model.get('descriptors')[targetDescriptorModelType.id]];

                if (format.type.startsWith('enum_')) {
                    switch (condition.condition) {
                        case 0:
                            display = values[0] == null || values[0] === "";
                            break;
                        case 1:
                            display = values[0] != null && values[0] !== "";
                            break;
                        case 2:
                            display = values[0] === condition.values[0];
                            break;
                        case 3:
                            display = values[0] !== condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else if (format.type === "entity") {
                    switch (condition.condition) {
                        case 0:
                            display = values[0] == null || values[0] === "";
                            break;
                        case 1:
                            display = values[0] != null && values[0] !== "";
                            break;
                        case 2:
                            display = values[0] === condition.values[0];
                            break;
                        case 3:
                            display = values[0] !== condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else if (format.type === "boolean") {
                    switch (condition.condition) {
                        case 0:
                            display = false;  // a boolean is always defined
                            break;
                        case 1:
                            display = true;  // a boolean is always defined
                            break;
                        case 2:
                            display = values[0] === condition.values[0];
                            break;
                        case 3:
                            display = value[0] !== condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else if ((format.type === "ordinal") && ((format.range[1] - format.range[0] + 1) <= 256)) {
                    switch (condition.condition) {
                        case 0:
                            display = false;  // an ordinal is always defined
                            break;
                        case 1:
                            display = true;  // an ordinal is always defined
                            break;
                        case 2:
                            display = values[0] === condition.values[0];
                            break;
                        case 3:
                            display = values[0] !== condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else if ((format.type === "date") || (format.type === "time") || (format.type === "datetime")) {
                    switch (condition.condition) {
                        case 0:
                            display = values[0] == null || values[0] === "";
                            break;
                        case 1:
                            display = values[0] != null && values[0] !== "";
                            break;
                        case 2:
                            display = values[0] === condition.values[0];
                            break;
                        case 3:
                            display = values[0] !== condition.values[0];
                            break;
                        default:
                            break;
                    }
                } else {
                    // numeric, numeric range, ordinal with more than 256 values, text with regexp
                    switch (condition.condition) {
                        case 0:
                            display = values[0] == null || values[0] === "";
                            break;
                        case 1:
                            display = values[0] != null && values[0] !== "";
                            break;
                        case 2:
                            display = values[0] === condition.values[0];
                            break;
                        case 3:
                            display = values[0] !== condition.values[0];
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
    
    onModify: function () {

    }
});

module.exports = View;
