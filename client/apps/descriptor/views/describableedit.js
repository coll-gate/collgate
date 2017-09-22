/**
 * @file describableedit.js
 * @brief Describable entity item edit view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-15
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ItemView = require('../../main/views/itemview');

var View = ItemView.extend({
    tagName: 'div',
    template: require('../templates/describableedit.html'),
    templateContext: function () {
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

        // no need to follow changes during edition
        // this.listenTo(this.model, 'change:descriptors', this.render, this);
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
                defaultValues = model.get('descriptors')[descriptorModelType.name];
                definesValues = defaultValues != null && defaultValues != undefined;
            } else {
                // @todo default value from descriptor type
                switch (format.type) {
                    case "boolean":
                        defaultValues = false;
                        definesValues = true;
                        break;
                    default:
                        break;
                }
            }

            var widget = application.descriptor.widgets.newElement(format.type);
            if (widget) {
                widget.create(format, el.children('td.descriptor-value'), false, descriptorType.group, descriptorType.id);
                widget.set(format, definesValues, defaultValues, descriptorType.group, descriptorType.id);

                if (descriptorModelType.set_once && exists) {
                    widget.disable();
                }
            }

            // save the descriptor format type widget instance
            descriptorModelType.widget = widget;
        });
    },

    onDomRefresh: function() {
        var descriptors = {};

        // firstly make a list for each descriptor of which descriptors need them for a condition
        for (var pi = 0; pi < this.descriptorMetaModelLayout.panels.length; ++pi) {
            for (var i = 0; i < this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types.length; ++i) {
                var descriptorModelType = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
                var condition = descriptorModelType.condition;

                // if given set initials values for the widget
                if (this.model.isNew()) {
                    // @todo
                }

                if (condition.defined) {
                    /* @todo optimize with model not dom */
                    var target = this.$el.find("tr.descriptor[descriptor-model-type=" + condition.target + "]");
                    var targetDescriptorModelType = this.descriptorMetaModelLayout.panels[target.attr('panel-index')].descriptor_model.descriptor_model_types[target.attr('index')];

                    if (targetDescriptorModelType.widget && descriptorModelType.widget) {
                        if (targetDescriptorModelType.id in descriptors) {
                            descriptors[targetDescriptorModelType.id].listeners.push(descriptorModelType.widget);
                        } else {
                            descriptors[targetDescriptorModelType.id] = {
                                widget: targetDescriptorModelType.widget,
                                conditionType: condition.condition,
                                conditionValue: condition.values,
                                listeners: [descriptorModelType.widget]
                            };
                        }

                        // initial state of the condition
                        var display = targetDescriptorModelType.widget.checkCondition(condition.condition, condition.values);

                        if (!display) {
                            // hide at tr level
                            descriptorModelType.widget.parent.parent().hide(false);
                        }
                    }
                }
            }
        }

        // once lists are done attach them to their widgets and bind the change event
        for (var k in descriptors) {
            var descriptor = descriptors[k];
            descriptor.widget.bindConditionListener(descriptor.listeners, descriptor.conditionType, descriptor.conditionValue);
        }
    },

    onBeforeDetach: function() {
        // destroy any widgets
        for (var pi = 0; pi < this.descriptorMetaModelLayout.panels.length; ++pi) {
            for (var i = 0; i < this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types.length; ++i) {
                var descriptorModelType = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
                if (descriptorModelType.widget) {
                    descriptorModelType.widget.destroy();
                }
            }
        }
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

    prepareDescriptors: function () {
        var descriptors = {};

        for (var pi = 0; pi < this.descriptorMetaModelLayout.panels.length; ++pi) {
            for (var i = 0; i < this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types.length; ++i) {
                var descriptorModelType = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];

                var mandatory = descriptorModelType.mandatory;

                var currValue = this.model.get('descriptors')[descriptorModelType.name];
                var values = null;

                // display of the tr
                if (descriptorModelType.widget && descriptorModelType.widget.parent.parent().css('display') !== "none") {
                    values = descriptorModelType.widget.values();
                }

                if (mandatory && values == null) {
                    $.alert.error(_t("Field " + descriptorModelType.label + " is required"));
                    return null;
                }

                var write = true;
                if (descriptorModelType.set_once && currValue != null) {
                    write = false;
                }

                if (descriptorModelType.widget && descriptorModelType.widget.compare(values, currValue)) {
                    write = false;
                }

                if (write) {
                    descriptors[descriptorModelType.name] = values;
                }
            }
        }

        return descriptors;
    },

    cancel: function() {
        // destroy any widgets
        for (var pi = 0; pi < this.descriptorMetaModelLayout.panels.length; ++pi) {
            for (var i = 0; i < this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types.length; ++i) {
                var descriptorModelType = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
                if (descriptorModelType.widget) {
                    descriptorModelType.widget.cancel();
                }
            }
        }
    },

    onCancel: function() {
        this.cancel();

        // non optimized default behavior reload url
        Backbone.history.loadUrl();
    },

    onApply: function() {
        // non optimized default behavior, load after save
        var model = this.model;

        var descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        this.model.save({descriptors: descriptors}, {wait: true, patch: !model.isNew()}).then(function () {
            Backbone.history.loadUrl();
        });
    }
});

module.exports = View;
