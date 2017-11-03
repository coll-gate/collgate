/**
 * @file describabledetails.js
 * @brief Describable entity details item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let ItemView = require('../../main/views/itemview');

let View = ItemView.extend({
    tagName: 'div',
    template: require('../templates/describabledetails.html'),
    templateContext: function () {
        return {
            panels: this.descriptorMetaModelLayout.panels,
            target: this.descriptorMetaModelLayout.target
        };
    },

    ui: {
        "descriptor": "tr.descriptor",
        "modify": "button.modify"
    },

    triggers: {

    },

    events: {
        "click @ui.modify": "onModify"
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        this.descriptorMetaModelLayout = options.descriptorMetaModelLayout;

        this.listenTo(this.model, 'change:descriptors', this.render, this);
    },

    onRender: function() {
        let view = this;
        let model = this.model;
        let descriptors = model.get('descriptors');

        $.each(this.ui.descriptor, function(index) {
            let el = $(this);

            let pi = el.attr('panel-index');
            let i = el.attr('index');
            let descriptorModelType = view.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
            let descriptorType = descriptorModelType.descriptor_type;
            let format = descriptorType.format;

            let values = model.get('descriptors')[descriptorModelType.name];

            let widget = application.descriptor.widgets.newElement(format.type);
            if (widget) {
                widget.create(format, el.children('td.descriptor-value'), true, descriptorType.group, descriptorType.id);
                widget.set(format, true, values, descriptorType.group, descriptorType.id);
            }

            // save the descriptor format type widget instance
            descriptorModelType.widget = widget;
        });
    },

    onDomRefresh: function() {
        for (let pi = 0; pi < this.descriptorMetaModelLayout.panels.length; ++pi) {
            for (let i = 0; i < this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types.length; ++i) {
                let descriptorModelType = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
                let condition = descriptorModelType.condition;

                if (condition.defined) {
                    // search the target descriptor type for the condition
                    let target = this.$el.find("tr.descriptor[descriptor-model-type=" + condition.target + "]");
                    let targetDescriptorModelType = this.descriptorMetaModelLayout.panels[target.attr('panel-index')].descriptor_model.descriptor_model_types[target.attr('index')];

                    // initial state of the condition
                    let display = true;

                    if (targetDescriptorModelType.widget) {
                        display = targetDescriptorModelType.widget.checkCondition(condition.condition, condition.values);
                    }

                    if (!display) {
                        // hide at tr level
                        if (descriptorModelType.widget) {
                            descriptorModelType.widget.parent.parent().hide(false);
                        }
                    }
                }
            }
        }
    },

    onBeforeDetach: function() {
        // destroy any widgets
        for (let pi = 0; pi < this.descriptorMetaModelLayout.panels.length; ++pi) {
            for (let i = 0; i < this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types.length; ++i) {
                let descriptorModelType = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
                if (descriptorModelType.widget) {
                    descriptorModelType.widget.destroy();
                }
            }
        }
    },

    onModify: function () {

    }
});

module.exports = View;
