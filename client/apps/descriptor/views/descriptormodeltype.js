/**
 * @file descriptormodeltype.js
 * @brief Type of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let DescriptorTypeModel = require('../models/descriptortype');


let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object descriptor-model-type',
    template: require('../templates/descriptormodeltype.html'),

    templateContext: function () {
        return {
            descriptor_type_groups: this.getOption('descriptor_type_groups')
        }
    },

    attributes: {
        draggable: true
    },

    ui: {
        'delete_descriptor_model_type': 'span.delete-descriptor-model-type',
        'name': 'td[name="name"]',
        'label': 'td[name="label"]',
        'mandatory': 'td[name="mandatory"]',
        'set_once': 'td[name="set_once"]',
        'condition': 'td[name="condition"]',
        'index': 'td[name="index"]'
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop',
        'click @ui.delete_descriptor_model_type': 'deleteDescriptorModelType',
        'click @ui.name': 'rename',
        'click @ui.label': 'editLabel',
        'click @ui.mandatory': 'toggleMandatory',
        'click @ui.set_once': 'toggleSetOnce',
        'click @ui.condition': 'editCondition',
        'click @ui.index': 'changeIndex'
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        if (!session.user.isStaff && !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_model_type).hide();
        }

        if (this.model.get('mandatory')) {
            this.ui.condition.prop('disabled', true);
            this.ui.condition.children('span').css('color', '#ddd');
        }
    },

    dragStart: function(e) {
        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

        this.$el.css('opacity', '0.4');
        application.main.dnd.set(this, 'descriptor-model-type');
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
        application.main.dnd.unset();
    },

    dragOver: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        //e.originalEvent.dataTransfer.dropEffect = 'move';
        return false;
    },

    dragEnter: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (!application.main.dnd.hasView('descriptor-type descriptor-model-type')) {
            return false;
        }

        if (application.main.dnd.get().$el.hasClass('descriptor-model-type')) {
            if (this.model.get('position') < application.main.dnd.get().model.get('position')) {
                this.$el.css('border-top', '5px dashed #ddd');
            } else if (this.model.get('position') > application.main.dnd.get().model.get('position')) {
                this.$el.css('border-bottom', '5px dashed #ddd');
            }
        } else if (application.main.dnd.get().$el.hasClass('descriptor-type')) {
            this.$el.css('border-top', '5px dashed #ddd');
        }

        return false;
    },

    dragLeave: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (!application.main.dnd.hasView('descriptor-type descriptor-model-type')) {
            return false;
        }

        if (application.main.dnd.get().$el.hasClass('descriptor-model-type')) {
            if (this.model.get('position') < application.main.dnd.get().model.get('position')) {
                this.$el.css('border-top', 'initial');
            } else if (this.model.get('position') > application.main.dnd.get().model.get('position')) {
                this.$el.css('border-bottom', 'initial');
            }
        } else if (application.main.dnd.get().$el.hasClass('descriptor-type')) {
            this.$el.css('border-top', 'initial');
        }

        return false;
    },

    drop: function (e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation();
        }

        if (!application.main.dnd.hasView('descriptor-type descriptor-model-type')) {
            return false;
        }

        let elt = application.main.dnd.get();
        if (elt.$el.hasClass('descriptor-type')) {
            // reset borders
            this.$el.css('border-top', 'initial');
            this.$el.css('border-bottom', 'initial');

            let DefinesLabel = Dialog.extend({
                template: require('../templates/descriptormodeltypecreate.html'),

                attributes: {
                    id: "dlg_define_label"
                },

                ui: {
                    name: "#descriptor_model_type_name",
                    label: "#descriptor_model_type_label"
                },

                events: {
                    'input @ui.name': 'onNameInput',
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

                    if (v.length < 1) {
                        $(this.ui.label).validateField('failed', g_t('characters_min', {count: 1}));
                        return false;
                    }

                    $(this.ui.label).validateField('ok');

                    return true;
                },

                onNameInput: function () {
                    this.validateName();
                },

                validateName: function() {
                    let v = this.ui.name.val();
                    let re = /^[a-zA-Z0-9_\-]+$/i;

                    if (v.length > 0 && !re.test(v)) {
                        $(this.ui.name).validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
                        return false;
                    }

                    $(this.ui.name).validateField('ok');

                    return true;
                },

                onApply: function() {
                    let view = this;
                    let collection = this.getOption('collection');
                    let position = this.getOption('position');
                    let code = this.getOption('code');

                    if (this.validateName() && this.validateLabel()) {
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
                            descriptor_type_code: code,
                            name: this.ui.name.val(),
                            label: this.ui.label.val(),
                            position: position
                        }, {
                            wait: true,
                            success: function () {
                                view.destroy();
                            },
                            error: function () {
                                $.alert.error(_t("Unable to create the type of model of descriptor !"));

                                // left shift (undo) for consistency with server
                                for (let i = 0; i < to_rshift.length; ++i) {
                                    to_rshift[i].set('position', to_rshift[i].get('position')-1);
                                }
                            }
                        });
                    }
                }
            });

            let definesLabel = new DefinesLabel({
                collection: this.model.collection,
                position: this.model.get('position'),
                code: elt.model.get('code')
            });

            definesLabel.render();
        }
        else if (elt.$el.hasClass('descriptor-model-type')) {
            // useless drop on himself
            if (this === elt) {
                return false;
            }

            // reset borders
            this.$el.css('border-top', 'initial');
            this.$el.css('border-bottom', 'initial');

            // ajax call
            let position = elt.model.get('position');
            let newPosition = this.model.get('position');
            let modelId = this.model.collection.model_id;
            let collection = this.model.collection;

            $.ajax({
                type: "PUT",
                url: window.application.url(['descriptor', 'model', modelId, 'order']),
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    descriptor_model_type_id: elt.model.get('id'),
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
                $.alert.error(_t('Unable to reorder the types of model of descriptor'));
            })
        }

        return false;
    },

    rename: function() {
        if (!session.user.isSuperUser || !session.user.isStaff) {
            return;
        }

        let ChangeName = require('../../main/views/entityrename');
        let changeName = new ChangeName({
            model: this.model,
            title: _t("Rename the type of model of descriptors")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    },

    editLabel: function() {
        let ChangeLabel = require('../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the type of model of descriptor")});

        changeLabel.render();

        return false;
    },

    toggleMandatory: function() {
        this.model.save({mandatory: !this.model.get('mandatory')}, {patch: true, wait: true});
    },

    toggleSetOnce: function() {
        this.model.save({set_once: !this.model.get('set_once')}, {patch: true, wait: true});
    },

    changeIndex: function() {
        let model = this.model;

        let ChangeIndex = Dialog.extend({
            template: require('../templates/descriptormodeltypechangeindex.html'),

            attributes: {
                id: "dlg_change_index"
            },

            ui: {
                index: "select[name=index]"
            },

            initialize: function (options) {
                ChangeIndex.__super__.initialize.apply(this, arguments);
            },

            onRender: function () {
                ChangeIndex.__super__.onRender.apply(this);

                this.ui.index.val(this.model.get('index')).selectpicker({
                    style: 'btn-default',
                    container: 'body'
                });
            },

            onBeforeDestroy: function () {
                this.ui.index.selectpicker('destroy');

                ChangeIndex.__super__.onBeforeDestroy.apply(this);
            },

            onApply: function () {
                let index = parseInt(this.ui.index.val());

                this.model.save({index: index}, {patch: true, wait: true});
                this.destroy();
            }
        });

        let changeIndex = new ChangeIndex({model: model});
        changeIndex.render();
    },

    deleteDescriptorModelType: function() {
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
    },

    editCondition: function() {
        let model = this.model;

        $.ajax({
            type: "GET",
            url: this.model.url() + 'condition/',
            dataType: 'json'
        }).done(function (data) {
            let condition = data;

            let ChangeCondition = Dialog.extend({
                template: require('../templates/descriptormodeltypecondition.html'),
                templateContext: function () {
                    return {
                        targets: model.collection.models,
                        condition: condition
                    };
                },

                attributes: {
                    id: "dlg_change_condition"
                },

                ui: {
                    condition: "#condition",
                    target: "#target",
                    condition_values: "div.condition-values",
                    destroy: "button.destroy"
                },

                events: {
                    'change @ui.condition': 'onSelectCondition',
                    'change @ui.target': 'onSelectTarget',
                    'click @ui.destroy': 'onDestroyCondition'
                },

                initialize: function (options) {
                    ChangeCondition.__super__.initialize.apply(this);
                },

                onRender: function() {
                    ChangeCondition.__super__.onRender.apply(this);
                    application.descriptor.views.conditions.drawSelect(this.ui.condition);

                    $(this.ui.target).selectpicker({container: 'body', style: 'btn-default'});

                    // initial values set after getting them from dropdown or autocomplete initialization
                    let condition = this.getOption('condition');
                    if (condition.defined) {
                        this.definesValues = true;
                        this.defaultValues = condition.values;

                        this.ui.target.val(condition.target).trigger('change');
                        this.ui.condition.val(condition.condition).trigger('change');
                    } else {
                        this.onSelectCondition();
                        this.onSelectTarget();
                    }
                },

                onBeforeDestroy: function() {
                    this.ui.target.selectpicker('destroy');
                    this.ui.condition.selectpicker('destroy');

                    if (this.descriptorType && this.descriptorType.widget) {
                        this.descriptorType.widget.destroy();
                        this.descriptorType.widget = null;
                    }

                    ChangeCondition.__super__.onBeforeDestroy.apply(this);
                },

                toggleCondition: function (condition) {
                    if (condition === 0 || condition === 1) {
                        this.ui.condition_values.hide(false);
                    } else {
                        this.ui.condition_values.show(false);
                    }
                },

                onSelectCondition: function () {
                    let val = parseInt(this.ui.condition.val());
                    this.toggleCondition(val);
                },

                onSelectTarget: function () {
                    let view = this;
                    let targetId = this.ui.target.val();

                    let model = this.getOption('model').collection.findWhere({id: parseInt(targetId)});
                    if (model) {
                        // destroy an older widget and label
                        if (this.descriptorType && this.descriptorType.widget) {
                            this.descriptorType.widget.destroy();
                            this.ui.condition_values.children('label').remove();
                        }

                        this.descriptorType = new DescriptorTypeModel(
                            {id: model.get('descriptor_type')},
                            {group_id: model.get('descriptor_type_group')}
                        );

                        this.descriptorType.fetch().then(function() {
                            let format = view.descriptorType.get('format');

                            let condition = parseInt(view.ui.condition.val());
                            view.toggleCondition(condition);

                            // unit label
                            let unit = format.unit === "custom" ? 'custom_unit' in format ? format.custom_unit : "" : format.unit;

                            if (unit !== "") {
                                let label = $('<label class="control-label">' + _t("Value") + '&nbsp;<span>(' + unit + ')</span></label>');
                                view.ui.condition_values.append(label);
                            } else {
                                let label = $('<label class="control-label">' + _t("Value") + '</label>');
                                view.ui.condition_values.append(label);
                            }

                            let widget = application.descriptor.widgets.newElement(format.type);
                            widget.create(format, view.ui.condition_values, {
                                readOnly: false,
                                descriptorTypeId: view.descriptorType.id
                            });

                            if (view.definesValues) {
                                widget.set(format, view.definesValues, view.defaultValues, {
                                    descriptorTypeId: view.descriptorType.id
                                });
                            }

                            // save the descriptor format type widget instance
                            view.descriptorType.widget = widget;

                            if (view.definesValues) {
                                view.definesValues = false;
                                view.defaultValues = null;
                            }
                        });
                    }
                },

                onDestroyCondition: function() {
                    let view = this;
                    let model = this.getOption('model');
                    let condition = this.getOption('condition');

                    // destroy the widget
                    if (this.descriptorType && this.descriptorType.widget) {
                        this.descriptorType.widget.destroy();
                        this.descriptorType.widget = null;
                    }

                    $.ajax({
                        type: "DELETE",
                        url: model.url() + "condition/",
                        contentType: "application/json; charset=utf-8"
                    }).done(function() {
                        $.alert.success(_t("Successfully removed !"));
                    }).always(function() {
                        view.destroy();
                    });
                },

                onApply: function () {
                    let view = this;
                    let model = this.getOption('model');
                    let condition = this.getOption('condition');

                    let data = {
                        target: parseInt(this.ui.target.val()),
                        condition: parseInt(this.ui.condition.val())
                    };

                    if (!this.descriptorType || !this.descriptorType.widget) {
                        return this.onDestroyCondition();
                    }

                    if (data.condition === 2 || data.condition === 3) {
                        data.values = this.descriptorType.widget.values();
                    } else {
                        data.values = null;
                    }

                    // destroy the widget
                    this.descriptorType.widget.destroy();

                    // depending if the condition previously existed: post or put.
                    if (condition.defined) {
                        $.ajax({
                            type: "PUT",
                            url: model.url() + "condition/",
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify(data)
                        }).done(function() {
                            $.alert.success(_t("Successfully defined !"));
                        }).always(function() {
                            view.destroy();
                        });
                    } else {
                        $.ajax({
                            type: "POST",
                            url: model.url() + "condition/",
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify(data)
                        }).done(function () {
                            $.alert.success(_t("Successfully defined !"));
                        }).always(function () {
                            view.destroy();
                        });
                    }
                }
            });

            let changeCondition = new ChangeCondition({model: model, condition: condition});
            changeCondition.render();
        });
    }
});

module.exports = View;
