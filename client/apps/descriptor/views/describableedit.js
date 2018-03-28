/**
 * @file describableedit.js
 * @brief Describable entity item edit view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-15
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let ItemView = require('../../main/views/itemview');

let View = ItemView.extend({
    tagName: 'div',
    template: require('../templates/describableedit.html'),
    templateContext: function () {
        let result = {};

        let i;
        for (i = 0; i < this.descriptorCollection.length; i++) {
            let model = this.descriptorCollection.models[i];
            result[model.get('name')] = model.attributes;
        }

        return {
            panels: this.layoutData.layout_content.panels,
            target: this.layoutData.target,
            descriptors_data: result
        }
    },

    ui: {
        "descriptor": "tr.descriptor",
        "cancel": "button.cancel",
        "apply": "button.apply",
        "showDescriptorHistory": "span.show-descriptor-history"
    },

    events: {
        "click @ui.cancel": "onCancel",
        "click @ui.apply": "onApply",
        "click @ui.showDescriptorHistory": "onShowDescriptorHistory"
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        this.layoutData = options.layoutData;
        this.descriptorCollection = options.descriptorCollection;

        // no need to follow changes during edition
        // this.listenTo(this.model, 'change:descriptors', this.render, this);
    },

    onRender: function() {
        let view = this;
        let model = this.model;
        let exists = !model.isNew();

        $.each(this.ui.descriptor, function(index) {
            let el = $(this);

            let pi = el.attr('panel-index');
            let i = el.attr('index');
            let layoutDescriptorModel = view.layoutData.layout_content.panels[pi].descriptors[i];
            let descriptorModel = view.descriptorCollection.findWhere({name: layoutDescriptorModel.name});
            let format = descriptorModel.get('format');

            let definesValues = false;
            let defaultValues = null;

            // default value or current descriptor value
            if (exists) {
                defaultValues = model.get('descriptors')[descriptorModel.get('code')];
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

            let widget = window.application.descriptor.widgets.newElement(format.type);
            if (widget) {
                widget.create(format, el.children('td.descriptor-value'), {
                    readOnly: false,
                    history: true,
                    descriptorId: descriptorModel.get('id')
                });

                widget.set(format, definesValues, defaultValues, {
                    descriptorId: descriptorModel.get('id'),
                    descriptor: layoutDescriptorModel
                });

                if (layoutDescriptorModel.set_once && exists) {
                    widget.disable();
                }
            }

            // save the descriptor format type widget instance
            descriptorModel.widget = widget;
        });
    },

    onDomRefresh: function() {
        let descriptors = {};

        // firstly make a list for each descriptor of which descriptors need them for a condition
        for (let pi = 0; pi < this.layoutData.layout_content.panels.length; ++pi) {
            for (let i = 0; i < this.layoutData.layout_content.panels[pi].descriptors.length; ++i) {
                let layoutDescriptorModel = this.layoutData.layout_content.panels[pi].descriptors[i];
                let conditions = layoutDescriptorModel.conditions;

                // if given set initials values for the widget
                if (this.model.isNew()) {
                    // @todo
                }

                if (conditions) {
                    let targetDescriptorModel = this.descriptorCollection.findWhere({'name': conditions.target_name});
                    let descriptorModel = this.descriptorCollection.findWhere({'name': layoutDescriptorModel.name});

                    if (targetDescriptorModel.widget && descriptorModel.widget) {
                        if (targetDescriptorModel.id in descriptors) {
                            descriptors[targetDescriptorModel.id].listeners.push(descriptorModel.widget);
                        } else {
                            descriptors[targetDescriptorModel.id] = {
                                widget: targetDescriptorModel.widget,
                                conditionType: conditions.condition,
                                conditionValue: conditions.values,
                                listeners: [descriptorModel.widget]
                            };
                        }

                        // initial state of the condition
                        let display = targetDescriptorModel.widget.checkCondition(conditions.condition, conditions.values);

                        if (!display) {
                            // hide at tr level
                            descriptorModel.widget.parent.parent().hide(false);
                        }
                    }
                }
            }
        }

        // once lists are done attach them to their widgets and bind the change event
        for (let k in descriptors) {
            let descriptor = descriptors[k];
            descriptor.widget.bindConditionListener(descriptor.listeners, descriptor.conditionType, descriptor.conditionValue);
        }
    },

    onBeforeDetach: function() {
        // destroy any widgets
        for (let pi = 0; pi < this.layoutData.layout_content.panels.length; ++pi) {
            for (let i = 0; i < this.layoutData.layout_content.panels[pi].descriptors.length; ++i) {
                let layoutDescriptorModel = this.layoutData.layout_content.panels[pi].descriptors[i];
                let descriptorModel = this.descriptorCollection.findWhere({'name': layoutDescriptorModel.name});
                if (descriptorModel.widget) {
                    descriptorModel.widget.destroy();
                    descriptorModel.widget = null;
                }
            }
        }
    },

    prepareDescriptors: function () {
        let descriptors = {};

        for (let pi = 0; pi < this.layoutData.layout_content.panels.length; ++pi) {
            for (let i = 0; i < this.layoutData.layout_content.panels[pi].descriptors.length; ++i) {
                let layoutDescriptor = this.layoutData.layout_content.panels[pi].descriptors[i];
                let descriptorModel = this.descriptorCollection.findWhere({'name': layoutDescriptor.name});

                let mandatory = layoutDescriptor.mandatory;

                let currValue = this.model.get('descriptors')[descriptorModel.get('name')];
                let values = null;

                // display of the tr
                if (descriptorModel.widget && descriptorModel.widget.parent.parent().css('display') !== "none") {
                    values = descriptorModel.widget.values();
                }

                if (mandatory && values === null) {
                    $.alert.error(_t("Field " + descriptorModel.get('label') + " is required"));
                    return null;
                }

                let write = true;
                if (layoutDescriptor.set_once && currValue !== null) {
                    write = false;
                }

                if (descriptorModel.widget && descriptorModel.widget.compare(values, currValue)) {
                    write = false;
                }

                if (write) {
                    descriptors[descriptorModel.get('name')] = values;
                }
            }
        }

        return descriptors;
    },

    cancel: function() {
        // destroy any widgets
        for (let pi = 0; pi < this.layoutData.layout_content.panels.length; ++pi) {
            for (let i = 0; i < this.layoutData.layout_content.panels[pi].descriptors.length; ++i) {
                let layoutDescriptor = this.layoutData.layout_content.panels[pi].descriptors[i];
                let descriptorModel = this.descriptorCollection.findWhere({'name': layoutDescriptor.name});
                if (descriptorModel.widget) {
                    descriptorModel.widget.cancel();
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
        let model = this.model;

        let descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        this.model.save({descriptors: descriptors}, {wait: true, patch: !model.isNew()}).then(function () {
            Backbone.history.loadUrl();
        });
    },

    onShowDescriptorHistory: function(e) {
        let tr = $(e.target).closest("tr");
        let panelIndex = tr.attr("panel-index");
        let index = tr.attr("index");

        let layoutDescriptor = this.layoutData.layout_content.panels[panelIndex].descriptors[index];
        let descriptorModel = this.descriptorCollection.findWhere({'name': layoutDescriptor.name});

        if (descriptorModel && descriptorModel.widget) {
            let tokens = this.model.url().split('/');

            let appLabel = tokens[tokens.length-4];
            let modelName = tokens[tokens.length-3];
            let objectId = tokens[tokens.length-2];
            let valueName = '#' + descriptorModel.get('code');

            let options = {};

            descriptorModel.widget.showHistory(appLabel, modelName, objectId, valueName, descriptorModel, options);
        }
    }
});

module.exports = View;
