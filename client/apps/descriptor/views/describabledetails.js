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
        let result = {};

        if (this.descriptorCollection) {
            let i;
            for (i = 0; i < this.descriptorCollection.length; i++) {
                let model = this.descriptorCollection.models[i];
                result[model.get('name')] = model.attributes;
            }
        }


        return {
            panels: this.layoutData.layout_content.panels,
            target: this.layoutData.target,
            descriptors_data: result
        }
    },

    ui: {
        "descriptor": "tr.descriptor",
        "modify": "button.modify",
        "showDescriptorHistory": "span.show-descriptor-history"
    },

    triggers: {},

    events: {
        "click @ui.modify": "onModify",
        "click @ui.showDescriptorHistory": "onShowDescriptorHistory"
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this);

        this.layoutData = options.layoutData;
        this.descriptorCollection = options.descriptorCollection;
        this.listenTo(this.model, 'change:descriptors', this.render, this);
    },

    onRender: function () {
        let view = this;
        let model = this.model;
        // let descriptors = model.get('descriptors');

        $.each(this.ui.descriptor, function (index) {
            let el = $(this);

            let pi = el.attr('panel-index');
            let i = el.attr('index');
            let id = el.attr('descriptor');
            let descriptorModel = view.descriptorCollection.get(id);
            let format = descriptorModel.get('format');

            let values = (model.get('descriptors')[descriptorModel.get('code')] ? model.get('descriptors')[descriptorModel.get('code')] : null);

            let widget = window.application.descriptor.widgets.newElement(format.type);
            if (widget) {
                widget.create(format, el.children('td.descriptor-value'), {
                    readOnly: true,
                    history: true,
                    descriptorId: descriptorModel.get('id')
                });

                widget.set(format, true, values, {
                    descriptorId: descriptorModel.get('id'),
                    descriptor: descriptorModel.attributes
                });
            }

            // save the descriptor format type widget instance
            descriptorModel.widget = widget;
        });
    },

    onDomRefresh: function () {
        for (let pi = 0; pi < this.layoutData.layout_content.panels.length; ++pi) {
            for (let i = 0; i < this.layoutData.layout_content.panels[pi].descriptors.length; ++i) {
                let layoutDescriptorModel = this.layoutData.layout_content.panels[pi].descriptors[i];
                let descriptorModel = this.descriptorCollection.findWhere({'name': layoutDescriptorModel.name});
                let conditions = layoutDescriptorModel.conditions;

                if (conditions) {
                    // search the target descriptor type for the condition
                    let targetDescriptorModel = this.descriptorCollection.findWhere({'name': conditions.target_name});

                    // initial state of the condition
                    let display = true;

                    if (targetDescriptorModel.widget) {
                        display = targetDescriptorModel.widget.checkCondition(conditions.condition, conditions.values);
                    }

                    if (!display) {
                        // hide at tr level
                        if (descriptorModel.widget) {
                            descriptorModel.widget.parent.parent().hide(false);
                        }
                    }
                }
            }
        }
    },

    onBeforeDetach: function () {
        // destroy any widgets
        for (let pi = 0; pi < this.layoutData.layout_content.panels.length; ++pi) {
            for (let i = 0; i < this.layoutData.layout_content.panels[pi].descriptors.length; ++i) {
                let layoutDescriptorModel = this.layoutData.layout_content.panels[pi].descriptors[i];
                let descriptorModel = this.descriptorCollection.findWhere({'name': layoutDescriptorModel.name});
                if (descriptorModel.widget) {
                    descriptorModel.widget.destroy();
                }
            }
        }
    },

    onModify: function () {

    },

    onShowHistory: function () {
        // @todo
        alert("@todo");
    },

    onShowDescriptorHistory: function (e) {
        let tr = $(e.target).closest("tr");
        let panelIndex = tr.attr("panel-index");
        let index = tr.attr("index");

        let layoutDescriptorModel = this.layoutData.layout_content.panels[panelIndex].descriptors[index];
        let descriptorModel = this.descriptorCollection.findWhere({name: layoutDescriptorModel.name});
        if (descriptorModel && descriptorModel.widget) {
            let tokens = this.model.url().split('/');

            let appLabel = tokens[tokens.length - 4];
            let modelName = tokens[tokens.length - 3];
            let objectId = tokens[tokens.length - 2];
            let valueName = '#' + descriptorModel.get('code');

            let options = {};

            descriptorModel.widget.showHistory(
                appLabel, modelName, objectId, valueName, descriptorModel, options);
        }
    }
});

module.exports = View;
