/**
 * @file descriptorpanel.js
 * @brief Panel of model of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'object descriptor-panel',
    template: require('../templates/descriptorpanel.html'),

    attributes: {
        draggable: true
    },

    ui: {
        'delete_descriptor_panel': 'span.delete-descriptor-panel',
        'label': 'span.change-label',
        'top_placeholder': 'div.top-placeholder',
        'bottom_placeholder': 'div.bottom-placeholder'
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop',
        'click @ui.delete_descriptor_panel': 'deleteDescriptorPanel',
        'click @ui.label': 'editLabel'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        if (!session.user.isStaff && !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_panel).hide();
        }
    },

    dragStart: function(e) {
        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

        this.$el.css('opacity', '0.4');
        application.main.dnd.set(this, 'descriptor-panel');
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
        application.main.dnd.unset();
    },

    dragEnter: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 0);
        ++this.dragEnterCount;

        if (!application.main.dnd.hasView('descriptor-model descriptor-panel')) {
            return false;
        }

        if (this.dragEnterCount === 1) {
            if (application.main.dnd.get().$el.hasClass('descriptor-panel')) {
                if (this.model.get('position') < application.main.dnd.get().model.get('position')) {
                    this.ui.top_placeholder.css('display', 'block');
                } else if (this.model.get('position') > application.main.dnd.get().model.get('position')) {
                    this.ui.bottom_placeholder.css('display', 'block');
                }
            } else if (application.main.dnd.get().$el.hasClass('descriptor-model')) {
                this.ui.top_placeholder.css('display', 'block');
            }
        }

        return false;
    },

    dragLeave: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 1);
        --this.dragEnterCount;

        if (!application.main.dnd.hasView('descriptor-model descriptor-panel')) {
            return false;
        }

        if (this.dragEnterCount === 0) {
            if (application.main.dnd.get().$el.hasClass('descriptor-panel')) {
                if (this.model.get('position') < application.main.dnd.get().model.get('position')) {
                    this.ui.top_placeholder.css('display', 'none');
                } else if (this.model.get('position') > application.main.dnd.get().model.get('position')) {
                    this.ui.bottom_placeholder.css('display', 'none');
                }
            } else if (application.main.dnd.get().$el.hasClass('descriptor-model')) {
                this.ui.top_placeholder.css('display', 'none');
            }
        }

        return false;
    },

    dragOver: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        this.dragEnterCount || (this.dragEnterCount = 1);

        if (!application.main.dnd.hasView('descriptor-model descriptor-panel')) {
            return false;
        }

        if (this.dragEnterCount === 1) {
            if (application.main.dnd.get().$el.hasClass('descriptor-panel')) {
                if (this.model.get('position') < application.main.dnd.get().model.get('position')) {
                    this.ui.top_placeholder.css('display', 'block');
                } else if (this.model.get('position') > application.main.dnd.get().model.get('position')) {
                    this.ui.bottom_placeholder.css('display', 'block');
                }
            } else if (application.main.dnd.get().$el.hasClass('descriptor-model')) {
                this.ui.top_placeholder.css('display', 'block');
            }
        }

        //e.originalEvent.dataTransfer.dropEffect = 'move';
        return false;
    },

    drop: function (e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation();
        }

        this.dragEnterCount = 0;

        if (!application.main.dnd.hasView('descriptor-model descriptor-panel')) {
            return false;
        }

        let elt = application.main.dnd.get();
        if (elt.$el.hasClass('descriptor-model')) {
            // reset placeholders
            this.ui.top_placeholder.css('display', 'none');
            this.ui.bottom_placeholder.css('display', 'none');

            let DefinesLabel = Dialog.extend({
                template: require('../templates/descriptorpanelcreate.html'),

                attributes: {
                    id: "dlg_create_panel"
                },

                ui: {
                    label: "#label"
                },

                events: {
                    'input @ui.label': 'onLabelInput'
                },

                initialize: function (options) {
                    DefinesLabel.__super__.initialize.apply(this);
                },

                onLabelInput: function () {
                    this.validateLabel();
                },

                validateLabel: function() {
                    let v = this.ui.label.val();

                    if (v.length < 3) {
                        $(this.ui.label).validateField('failed', _t('characters_min', {count: 3}));
                        return false;
                    }

                    $(this.ui.label).validateField('ok');

                    return true;
                },

                onApply: function() {
                    let view = this;
                    let collection = this.getOption('collection');
                    let position = this.getOption('position');
                    let descriptor_model = this.getOption('descriptor_model');

                    if (this.validateLabel()) {
                        let to_rshift = [];

                        // server will r-shift position of any model upward this new
                        // do it locally to be consistent
                        for (let model in collection.models) {
                            let dmt = collection.models[model];
                            let p = dmt.get('position');
                            if (p >= position) {
                                dmt.set('position', p+1);
                                to_rshift.push(dmt);
                            }
                        }

                        collection.create({
                            descriptor_model: descriptor_model,
                            label: this.ui.label.val(),
                            position: position
                        }, {
                            wait: true,
                            success: function () {
                                view.destroy();
                            },
                            error: function () {
                                view.destroy();

                                // left shift (undo) for consistency with server
                                for (let i = 0; i < to_rshift.length; ++i) {
                                    to_rshift[i].set('position', to_rshift[i].get('position')-1);
                                }
                            }
                        });
                    }
                },
            });

            let definesLabel = new DefinesLabel({
                collection: this.model.collection,
                position: this.model.get('position'),
                descriptor_model: elt.model.get('id')
            });

            definesLabel.render();
        }
        else if (elt.$el.hasClass('descriptor-panel')) {
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
            }).done(function() {
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
    },

    editLabel: function() {
        let ChangeLabel = require('../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the panel of descriptor")});

        changeLabel.render();

        return false;
    },

    deleteDescriptorPanel: function() {
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
            }
        });
    }
});

module.exports = View;
