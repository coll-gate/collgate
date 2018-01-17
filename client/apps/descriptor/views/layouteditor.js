/**
 * @file layouteditor.js
 * @brief Editor of descriptors layout
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');
let DescriptorPanelView = require('../views/panel');
let ModelCollection = require('../collections/descriptormodel');

let View = Marionette.CompositeView.extend({
    template: require("../templates/layouteditor.html"),
    childView: DescriptorPanelView,
    childViewContainer: 'div.panel-list',

    ui: {
        'add_panel_btn': '.add-panel-btn',
    },

    events: {
        'click @ui.add_panel_btn': 'onAddPanel'
    },

    initialize: function () {
        View.__super__.initialize.apply(this);
        this.listenTo(this.collection, 'reset', this.render, this);
    },

    onRender: function () {

    },

    onAddPanel: function () {
        let AddPanelDialog = Dialog.extend({
            template: require('../templates/panelcreate.html'),

            ui: {
                'panel_name': '#panel_name',
                'create_btn': 'button.create'
            },

            events: {
                'click @ui.create_btn': 'onCreate',
                'keyup @ui.panel_name': 'onChangePanelName'
            },

            initialize: function () {
                AddPanelDialog.__super__.initialize.apply(this);
                this.modelCollection = new ModelCollection();
            },

            onRender: function () {
                AddPanelDialog.__super__.onRender.apply(this);
            },

            onCreate: function () {
                // todo: Check fields validity

                let view = this;
                view.collection.create({
                    // descriptor_model: model_id,
                    label: view.ui.panel_name.val(),
                    // position: view.collection.length
                }, {
                    wait: true,
                    success: function () {
                        view.destroy();
                    },
                    error: function () {
                        view.destroy();
                    }
                });
            }

        });

        let addPanelDialog = new AddPanelDialog({
            collection: this.collection
        });
        addPanelDialog.render()
    },

    onChildviewHideAddPanelButton: function (childView) {
        this.ui.add_panel_btn.css('opacity', '0');
    },

    onChildviewShowAddPanelButton: function (childView) {
        this.ui.add_panel_btn.css('opacity', '1');
    }
});

module.exports = View;
