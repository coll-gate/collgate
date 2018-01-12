/**
 * @file panel.js
 * @brief Panel of model of descriptor item view
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');
let DescriptorCollection = require('../collections/descriptormodeltype');
let DescriptorGroupCollection = require('../collections/descriptorgroup');
let DescriptorTypeCollection = require('../collections/descriptortype');
let PanelDescriptor = require('./layoutdescriptor');
let DescriptorTypeModel = require('../models/descriptortype');

let View = Marionette.CompositeView.extend({
    className: 'object descriptor-panel-view',
    template: require('../templates/panel.html'),
    childView: PanelDescriptor,
    childViewContainer: '.descriptor-list',

    ui: {
        'delete_descriptor_panel': '.delete-descriptor-panel',
        'label': '.rename',
        'top_placeholder': 'div.top-placeholder',
        'bottom_placeholder': 'div.bottom-placeholder',
        'drag_zone': 'div.panel-heading',
        "panel_descriptors": '.panel-descriptors',
        'add_btn': '.add-descriptor-btn'
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop',
        'click @ui.delete_descriptor_panel': 'deleteDescriptorPanel',
        'click @ui.label': 'editLabel',
        'dblclick @ui.drag_zone': 'onDoubleClick',
        'click @ui.add_btn': 'addDescriptor'
    },

    onDoubleClick: function () {
        this.ui.panel_descriptors.collapse('toggle')
    },

    initialize: function (options) {
        this.listenTo(this.model, 'change', this.render, this);
        this.collection = new DescriptorCollection([], {model_id: this.model.attributes.id, layout_id: this.model.collection.model_id});
        this.collection.fetch()
    },

    onRender: function () {
        if (!session.user.isStaff && !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_panel).hide();
        }
    },

    dragStart: function (e) {
        if (e.target.className === 'panel-heading descriptor-panel') {

            // fix for firefox...
            e.originalEvent.dataTransfer.setData('text/plain', null);

            this.$el.css('opacity', '0.4');
            application.main.dnd.set(this, 'descriptor-panel');
            this.triggerMethod('hide:addPanelButton', this);
        }
    },

    dragEnd: function (e) {
        this.$el.css('opacity', '1.0');
        application.main.dnd.unset();
        this.triggerMethod('show:addPanelButton', this);
    },

    dragEnter: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (application.main.dnd.hasView('descriptor-panel')) {

            this.dragEnterCount || (this.dragEnterCount = 0);
            ++this.dragEnterCount;

            if (this.dragEnterCount === 1) {
                if (application.main.dnd.get().$el.hasClass('descriptor-panel-view')) {
                    if (this.model.get('position') < application.main.dnd.get().model.get('position')) {
                        this.ui.top_placeholder.css('display', 'block');
                    } else if (this.model.get('position') > application.main.dnd.get().model.get('position')) {
                        this.ui.bottom_placeholder.css('display', 'block');
                    }
                }

                return false;
            }
        }
    },

    dragLeave: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (application.main.dnd.hasView('descriptor-panel')) {

            this.dragEnterCount || (this.dragEnterCount = 1);
            --this.dragEnterCount;

            if (this.dragEnterCount === 0) {

                if (application.main.dnd.get().$el.hasClass('descriptor-panel-view')) {
                    if (this.model.get('position') < application.main.dnd.get().model.get('position')) {
                        this.ui.top_placeholder.css('display', 'none');
                    } else if (this.model.get('position') > application.main.dnd.get().model.get('position')) {
                        this.ui.bottom_placeholder.css('display', 'none');
                    }
                }

                return false;
            }

        }
    },

    dragOver: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (application.main.dnd.hasView('descriptor-panel')) {

            this.dragEnterCount || (this.dragEnterCount = 1);

            if (this.dragEnterCount === 1) {
                if (application.main.dnd.get().$el.hasClass('descriptor-panel-view')) {
                    if (this.model.get('position') < application.main.dnd.get().model.get('position')) {
                        this.ui.top_placeholder.css('display', 'block');
                    } else if (this.model.get('position') > application.main.dnd.get().model.get('position')) {
                        this.ui.bottom_placeholder.css('display', 'block');
                    }
                }
            }

            //e.originalEvent.dataTransfer.dropEffect = 'move';
            return false;

        }
    },

    drop: function (e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation();
        }

        if (application.main.dnd.hasView('descriptor-panel')) {

            this.dragEnterCount = 0;

            let elt = application.main.dnd.get();
            if (elt.$el.hasClass('descriptor-panel-view')) {
                // useless drop on himself
                if (this === elt) {
                    return false;
                }

                // reset placeholder
                this.ui.top_placeholder.css('display', 'none');
                this.ui.bottom_placeholder.css('display', 'none');

                // ajax call
                let position = elt.model.get('position');
                let newPosition = this.model.get('position');
                let modelId = this.model.collection.model_id;
                let collection = this.model.collection;

                $.ajax({
                    type: "PUT",
                    url: window.application.url(['descriptor', 'meta-model', modelId, 'panel', 'order']),
                    dataType: 'json',
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify({
                        descriptor_panel_id: elt.model.get('id'),
                        position: newPosition
                    })
                }).done(function () {
                    // server will shift position of any model upward/downward this model
                    // do it locally to be consistent
                    // so that we don't need to collection.fetch({update: true, remove: true});
                    if (newPosition < position) {
                        let to_rshift = [];

                        for (let model in collection.models) {
                            let dmt = collection.models[model];
                            if (dmt.get('id') !== elt.model.get('id')) {
                                if (dmt.get('position') >= newPosition) {
                                    to_rshift.push(dmt);
                                }
                            }
                        }

                        elt.model.set('position', newPosition);

                        let nextPosition = newPosition + 1;

                        for (let i = 0; i < to_rshift.length; ++i) {
                            to_rshift[i].set('position', nextPosition);
                            ++nextPosition;
                        }
                    } else {
                        let to_lshift = [];

                        for (let model in collection.models) {
                            let dmt = collection.models[model];
                            if (dmt.get('id') !== elt.model.get('id')) {
                                if (dmt.get('position') <= newPosition) {
                                    to_lshift.push(dmt);
                                }
                            }
                        }

                        elt.model.set('position', newPosition);

                        let nextPosition = 0;

                        for (let i = 0; i < to_lshift.length; ++i) {
                            to_lshift[i].set('position', nextPosition);
                            ++nextPosition;
                        }
                    }

                    // need to sort
                    collection.sort();
                }).fail(function () {
                    $.alert.error(_t('Unable to reorder the panels of descriptor'));
                })
            }

            return false;

        }
    },

    editLabel: function () {
        let ChangeLabel = require('../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the panel of descriptor")
        });

        changeLabel.render();

        return false;
    },

    deleteDescriptorPanel: function () {
        let collection = this.model.collection;
        let position = this.model.get('position');

        this.model.destroy({
            wait: true,
            success: function () {
                for (let model in collection.models) {
                    let dmt = collection.models[model];
                    if (dmt.get('position') > position) {
                        let new_position = dmt.get('position') - 1;
                        dmt.set('position', new_position);
                    }
                }
                collection.fetch()
            }
        });
    },

    addDescriptor: function () {
        let AddDescriptorDialog = Dialog.extend({
            template: require('../templates/paneldescriptorcreate.html'),

            ui: {
                'descriptor_label': '#panel_descriptor_label',
                'descriptor_name': '#panel_descriptor_name',
                'type_select': '#type',
                'type_create_zone': '.descriptor-type-create-zone',
                'descriptor_type_name': '#descriptor_type_name',
                'descriptor_type_description': '#descriptor_type_description',
                'create_btn': 'button.create'
            },

            events: {
                'click @ui.create_btn': 'onCreate',
                'change @ui.type_select': 'onChangeType',
                'keyup @ui.descriptor_label': 'onChangeLabel',
                'change @ui.descriptor_label': 'onChangeLabel'
            },

            initialize: function (options) {
                AddDescriptorDialog.__super__.initialize.apply(this);
                this.descriptorGroupCollection = new DescriptorGroupCollection();
                this.descriptorModel = options.descriptorModel;
            },

            onRender: function () {
                AddDescriptorDialog.__super__.onRender.apply(this);

                let view = this;

                view.ui.type_select.selectpicker({});

                $.when(view.descriptorGroupCollection.fetch()).then(function () {
                    view.ui.type_select.children('option').remove();

                    let opt = $('<option></option>');
                    opt.attr('value', 'new');
                    opt.html("<strong class=''><span class='fa fa-plus'></span> " + _t("New descriptor type")) + "</strong>";

                    // idea: allow to create new descriptor type
                    // view.ui.type_select.append(opt);
                    // view.onChangeType();

                    let i;
                    for (i = 0; i < view.descriptorGroupCollection.length; i++) {
                        let opt_group = $('<optgroup></optgroup>');
                        opt_group.attr('label', view.descriptorGroupCollection.models[i].attributes.name);


                        let group_i = i;

                        let descriptorTypeCollection = new DescriptorTypeCollection([], {
                            group_id: view.descriptorGroupCollection.models[i].id
                        });

                        $.when(descriptorTypeCollection.fetch()).then(function () {
                            let i;
                            for (i = 0; i < descriptorTypeCollection.length; i++) {
                                let opt = $('<option></option>');
                                opt.attr('value', JSON.stringify([
                                    view.descriptorGroupCollection.models[group_i].id,
                                    descriptorTypeCollection.models[i].id
                                ]));
                                opt.attr('data-tokens', view.descriptorGroupCollection.models[group_i].attributes.name);
                                opt.html(descriptorTypeCollection.models[i].attributes.name);
                                opt.appendTo(opt_group)
                            }
                            opt_group.appendTo(view.ui.type_select);

                            if (group_i === view.descriptorGroupCollection.length - 1) {
                                view.ui.type_select.selectpicker('refresh');
                            }
                        });
                    }
                });
            },

            onChangeType: function () {
                if (this.ui.type_select.val() === 'new') {
                    this.ui.type_create_zone.show();
                } else {
                    this.ui.type_create_zone.hide();
                }
            },

            onChangeLabel: function () {
                let label_sanitized = this.ui.descriptor_label.val().toUpperCase().replace(/\s/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                this.ui.descriptor_name.val(label_sanitized);
                this.ui.descriptor_type_name.val(label_sanitized);
            },

            onCreate: function () {
                // todo: Check fields validity

                let view = this;
                let newPanelDescriptor = function (descriptor_type) {
                    view.collection.create({
                        name: view.ui.descriptor_name.val(),
                        model: view.descriptorModel,
                        label: view.ui.descriptor_label.val(),
                        position: view.collection.length,
                        descriptor_type_group: descriptor_type.group,
                        descriptor_type: descriptor_type.id,
                        descriptor_type_name: descriptor_type.attributes.name,
                        descriptor_type_code: descriptor_type.attributes.code,
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
                    // idea: allow to create new descriptor type
                    console.log('todo!');
                }
                else {
                    let selected_values = JSON.parse(view.ui.type_select.val());
                    let descriptorTypeModel = new DescriptorTypeModel({
                        id: selected_values[1]
                    },{
                        group_id: selected_values[0]
                    });
                    descriptorTypeModel.fetch().then(function () {
                        newPanelDescriptor(descriptorTypeModel);
                    });
                }
            }
        });

        let addDescriptorDialog = new AddDescriptorDialog({
            collection: this.collection,
            descriptorModel: this.descriptorModel,
        });
        addDescriptorDialog.render();
    },

    onChildviewHideAddButton: function (childView) {
        this.triggerMethod('hide:addPanelButton', this);
        this.ui.add_btn.css('opacity', '0');
    },

    onChildviewShowAddButton: function (childView) {
        this.triggerMethod('show:addPanelButton', this);
        this.ui.add_btn.css('opacity', '1');
    }
});

module.exports = View;
