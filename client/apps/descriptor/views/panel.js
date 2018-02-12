/**
 * @file panel.js
 * @brief Panel of layout item view
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');
let LayoutDescriptorCollection = require('../collections/layoutdescriptor');
let DescriptorGroupCollection = require('../collections/descriptorgroup');
let DescriptorTypeCollection = require('../collections/descriptor');
let PanelLayoutDescriptorView = require('./layoutdescriptor');
let LayoutDescriptorModel = require('../models/layoutdescriptor');

let View = Marionette.CompositeView.extend({
        className: 'object descriptor-panel-view',
        template: require('../templates/panel.html'),
        childView: PanelLayoutDescriptorView,
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
            this.collection = new LayoutDescriptorCollection([], {
                // model_id: this.model.attributes.id,
                model_id: this.model.collection.model_id,
                panel_index: this.model.attributes.id
            });

            // this.listenTo(this.collection, 'add', this.render, this);
            // this.listenTo(this.collection, 'add', this.collection.fetch(), this);
            this.collection.fetch();
        },

        onRender: function () {
            if (!window.application.permission.manager.isStaff()) {
                $(this.ui.delete_descriptor_panel).hide();
            }
        },

        dragStart: function (e) {
            if (e.target.className === 'panel-heading descriptor-panel') {

                // fix for firefox...
                e.originalEvent.dataTransfer.setData('text/plain', null);

                this.$el.css('opacity', '0.4');
                window.application.main.dnd.set(this, 'descriptor-panel');
                this.triggerMethod('hide:addPanelButton', this);
            }
        },

        dragEnd: function (e) {
            this.$el.css('opacity', '1.0');
            window.application.main.dnd.unset();
            this.triggerMethod('show:addPanelButton', this);
        },

        dragEnter: function (e) {
            if (e.originalEvent.preventDefault) {
                e.originalEvent.preventDefault();
            }

            if (window.application.main.dnd.hasView('descriptor-panel')) {

                this.dragEnterCount || (this.dragEnterCount = 0);
                ++this.dragEnterCount;

                if (this.dragEnterCount === 1) {
                    if (window.application.main.dnd.get().$el.hasClass('descriptor-panel-view')) {
                        if (this.model.get('position') < window.application.main.dnd.get().model.get('position')) {
                            this.ui.top_placeholder.css('display', 'block');
                        } else if (this.model.get('position') > window.application.main.dnd.get().model.get('position')) {
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

            if (window.application.main.dnd.hasView('descriptor-panel')) {

                this.dragEnterCount || (this.dragEnterCount = 1);
                --this.dragEnterCount;

                if (this.dragEnterCount === 0) {

                    if (window.application.main.dnd.get().$el.hasClass('descriptor-panel-view')) {
                        if (this.model.get('position') < window.application.main.dnd.get().model.get('position')) {
                            this.ui.top_placeholder.css('display', 'none');
                        } else if (this.model.get('position') > window.application.main.dnd.get().model.get('position')) {
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

            if (window.application.main.dnd.hasView('descriptor-panel')) {

                this.dragEnterCount || (this.dragEnterCount = 1);

                if (this.dragEnterCount === 1) {
                    if (window.application.main.dnd.get().$el.hasClass('descriptor-panel-view')) {
                        if (this.model.get('position') < window.application.main.dnd.get().model.get('position')) {
                            this.ui.top_placeholder.css('display', 'block');
                        } else if (this.model.get('position') > window.application.main.dnd.get().model.get('position')) {
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

            if (window.application.main.dnd.hasView('descriptor-panel')) {

                this.dragEnterCount = 0;

                let elt = window.application.main.dnd.get();
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

                    let self = this;

                    $.ajax({
                        type: "PUT",
                        url: window.application.url(['descriptor', 'layout', modelId, 'panel', 'order']),
                        dataType: 'json',
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({
                            descriptor_panel_id: elt.model.get('id'),
                            position: newPosition
                        })
                    }).done(function () {
                        // server will shift position of any model upward/downward this model
                        // do it locally to be consistent
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
                        collection.fetch();
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
                    'type_select': '#type',
                    'group_select': '#group',
                    'create_btn': 'button.create'
                },

                events: {
                    'click @ui.create_btn': 'onCreate',
                    'change @ui.type_select': 'onChangeType',
                    'keyup @ui.descriptor_label': 'onChangeLabel',
                    'change @ui.descriptor_label': 'onChangeLabel'
                },

                initialize: function (options) {
                    let view = this;
                    AddDescriptorDialog.__super__.initialize.apply(this);
                    this.descriptorGroupCollection = new DescriptorGroupCollection();
                    this.descriptorTypeCollection = new DescriptorTypeCollection();
                    this.layoutDescriptorCollection = new LayoutDescriptorCollection([], {
                        model_id: view.collection.model_id,
                    });
                },

                onRender: function () {
                    AddDescriptorDialog.__super__.onRender.apply(this);

                    let view = this;
                    let panel_descriptors_ids = [];

                    this.layoutDescriptorCollection.fetch().then(function () {
                        panel_descriptors_ids = view.layoutDescriptorCollection.models.map(x => x.id);
                        view.ui.type_select.selectpicker({});

                        view.descriptorGroupCollection.fetch().then(function () {
                            view.ui.type_select.children('option').remove();

                            let fetching;
                            if (panel_descriptors_ids.length) {

                                fetching = view.descriptorTypeCollection.fetch({
                                    data: {
                                        search: '[{"type":"term","field": "id", "value": [' + panel_descriptors_ids.join(',') + '], "op":"notin"}]'
                                    }
                                });
                            } else {
                                fetching = view.descriptorTypeCollection.fetch();
                            }

                            fetching.then(function () {
                                // Create drop-down descriptor groups
                                let i;
                                let opt_group_list = [];
                                for (i = 0; i < view.descriptorGroupCollection.length; i++) {
                                    let opt_group = $('<optgroup></optgroup>');
                                    let group_name = view.descriptorGroupCollection.models[i].attributes.group_name[0];
                                    opt_group.attr('label', group_name);
                                    opt_group_list.push({
                                        name: group_name,
                                        el: opt_group
                                    });
                                }

                                // Create descriptor options
                                let j;
                                for (j = 0; j < view.descriptorTypeCollection.length; j++) {
                                    let opt = $('<option></option>');
                                    opt.attr('value', JSON.stringify([
                                        view.descriptorTypeCollection.models[j].attributes.name,
                                        view.descriptorTypeCollection.models[j].attributes.id
                                    ]));
                                    opt.attr('data-tokens', view.descriptorTypeCollection.models[j].attributes.label + ',' + view.descriptorTypeCollection.models[j].attributes.name + ',' + view.descriptorTypeCollection.models[j].attributes.group_name);
                                    opt.html('<strong>' + view.descriptorTypeCollection.models[j].attributes.label + '</strong> <span class="text-muted">' + view.descriptorTypeCollection.models[j].attributes.name + '</span>');
                                    let opt_group = _.findWhere(opt_group_list, {name: view.descriptorTypeCollection.models[j].attributes.group_name});
                                    opt.appendTo(opt_group.el)
                                }

                                // Add descriptor groups to the selectpicker
                                let k;
                                for (k = 0; k < opt_group_list.length; k++) {
                                    opt_group_list[k].el.appendTo(view.ui.type_select);
                                }
                                view.ui.type_select.selectpicker('refresh');
                            })
                        })
                    })


                },

                onCreate: function () {
                    // todo: Check fields validity

                    let view = this;

                    let selected_values = view.ui.type_select.val();

                    let saveLayoutDescriptors = function (i) {
                        if (i < selected_values.length) {
                            let data = selected_values[i];
                            let option_values = JSON.parse(data);
                            let layoutDescriptor = new LayoutDescriptorModel({
                                name: option_values[0],
                                label: option_values[0]
                            }, {
                                collection: view.collection
                            });

                            view.collection.create(layoutDescriptor, {
                                success: function () {
                                    i++;
                                    saveLayoutDescriptors(i)
                                }
                            })
                        } else {
                            console.log('END!');
                        }
                    };

                    saveLayoutDescriptors(0);
                    addDescriptorDialog.destroy();
                }
            });

            let addDescriptorDialog = new AddDescriptorDialog({
                collection: this.collection,
            });
            addDescriptorDialog.render();
        },

        onChildviewHideAddButton: function (childView) {
            this.triggerMethod('hide:addPanelButton', this);
            this.ui.add_btn.css('opacity', '0');
        }
        ,

        onChildviewShowAddButton: function (childView) {
            this.triggerMethod('show:addPanelButton', this);
            this.ui.add_btn.css('opacity', '1');
        }
    })
;

module.exports = View;
