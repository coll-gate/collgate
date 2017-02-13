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

var View = ItemView.extend({
    tagName: 'div',
    template: require('../templates/describabledetails.html'),
    templateHelpers/*templateContext*/: function () {
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

            var values = model.get('descriptors')[descriptorModelType.id];

            var widget = application.descriptor.widgets.newElement(format.type);
            if (widget) {
                widget.create(format, el.children('td.descriptor-value'), true, descriptorType.group, descriptorType.id);
                widget.set(format, true, values, descriptorType.group, descriptorType.id);
            }

            // save the descriptor format type widget instance
            descriptorModelType.widget = widget;
        });
    },

    onDomRefresh: function() {
        for (var pi = 0; pi < this.descriptorMetaModelLayout.panels.length; ++pi) {
            for (var i = 0; i < this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types.length; ++i) {
                var descriptorModelType = this.descriptorMetaModelLayout.panels[pi].descriptor_model.descriptor_model_types[i];
                var condition = descriptorModelType.condition;

                if (condition.defined) {
                    // search the target descriptor type for the condition
                    var target = this.$el.find("tr.descriptor[descriptor-model-type=" + condition.target + "]");
                    var targetDescriptorModelType = this.descriptorMetaModelLayout.panels[target.attr('panel-index')].descriptor_model.descriptor_model_types[target.attr('index')];

                    // initial state of the condition
                    var display = true;

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
    
    onModify: function () {

    }
});

module.exports = View;
