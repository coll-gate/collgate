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
                "type_select": '#model',
                "type_create_zone": '.model-create-zone',
                'model_name': '#model_name',
                'model_verbose_name': '#model_verbose_name',
                'model_description': '.model-description',
                'model_alert': '.model-alert',
                'create_btn': 'button.create'
            },

            events: {
                'click @ui.create_btn': 'onCreate',
                'change @ui.model_select': 'onChangeModel',
                'keyup @ui.panel_name': 'onChangePanelName',
                'change @ui.panel_name': 'onChangePanelName'
            },

            initialize: function () {
                AddPanelDialog.__super__.initialize.apply(this);
                this.descriptorCollection = new ModelCollection();
            },

            onRender: function () {
                AddPanelDialog.__super__.onRender.apply(this);

                let view = this;

                view.ui.type_select.selectpicker({});

                $.when(view.descriptorCollection.fetch()).then(function () {
                    view.ui.type_select.children('option').remove();


                    let opt = $('<option></option>');
                    opt.attr('value', 'new');
                    opt.html("<strong class=''><span class='fa fa-plus'></span> " + _t("New model")) + "</strong>";
                    view.ui.type_select.append(opt);

                    let i;
                    for (i = 0; i < view.descriptorCollection.length; i++) {
                        let opt = $('<option></option>');
                        opt.attr('value', view.descriptorCollection.models[i].id);
                        opt.html(view.descriptorCollection.models[i].attributes.verbose_name);
                        view.ui.type_select.append(opt);
                    }

                    view.ui.type_select.selectpicker('refresh');

                });
            },

            onChangeType: function () {
                if (this.ui.type_select.val() === 'new') {
                    this.ui.type_create_zone.show();
                    this.ui.model_alert.hide()
                } else {
                    this.ui.type_create_zone.hide();
                    this.ui.model_alert.show()
                }
            },

            onChangePanelName: function () {
                this.ui.model_name.val(this.ui.panel_name.val().toUpperCase().replace(/\s/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ""));
            },

            onCreate: function () {
                // todo: Check fields validity

                let view = this;
                let newPanel = function (model_id) {
                    view.collection.create({
                        descriptor_model: model_id,
                        label: view.ui.panel_name.val(),
                        position: view.collection.length
                    }, {
                        wait: true,
                        success: function () {
                            view.destroy();
                        },
                        error: function () {
                            view.destroy();
                        }
                    });
                };

                if (this.ui.type_select.val() === 'new') {
                    this.descriptorCollection.create({
                        name: this.ui.model_name.val(),
                        verbose_name: this.ui.model_verbose_name.val(),
                        description: this.ui.model_description.val(),
                    }, {
                        wait: true,
                        success: function (model) {
                            newPanel(model.id);
                        },
                        error: function () {
                            view.destroy();
                        }
                    })
                }
                else {
                    newPanel(parseInt(view.ui.type_select.val()));
                }

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
