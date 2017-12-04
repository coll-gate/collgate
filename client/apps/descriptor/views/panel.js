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
let DescriptorCollection = require('../collections/descriptormodeltype');
let PanelDescriptor = require('../views/descriptor');

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
        'dblclick @ui.drag_zone': 'onDoubleClick'
    },

    onDoubleClick: function () {
        this.ui.panel_descriptors.collapse('toggle')
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
        this.collection = new DescriptorCollection([], {model_id: this.model.attributes.descriptor_model});
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
