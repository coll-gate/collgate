/**
 * @file descriptortype.js
 * @brief Type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var DescriptorTypeModel = require('../models/descriptortype');
var DescriptorModelTypeModel = require('../models/descriptormodeltype');


var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-model-type',
    template: require('../templates/descriptormodeltype.html'),

    attributes: {
        draggable: true,
    },

    ui: {
        'delete_descriptor_model_type': 'span.delete-descriptor-model-type',
        'label': 'td[name="label"]',
        'mandatory': 'td[name="mandatory"]',
        'set_once': 'td[name="set_once"]',
        'condition': 'td[name="condition"]'
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop',
        'click @ui.delete_descriptor_model_type': 'deleteDescriptorModelType',
        'click @ui.label': 'editLabel',
        'click @ui.mandatory': 'toggleMandatory',
        'click @ui.set_once': 'toggleSetOnce',
        'click @ui.condition': 'editCondition',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        if (!session.user.isStaff && !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_model_type).hide();
        }
    },

    dragStart: function(e) {
        this.$el.css('opacity', '0.4');
        application.dndElement = this;
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
        application.dndElement = null;
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

        if (application.dndElement.$el.hasClass('descriptor-model-type')) {
            if (this.model.get('position') < application.dndElement.model.get('position')) {
                this.$el.css('border-top', '5px dashed #ddd');
            } else if (this.model.get('position') > application.dndElement.model.get('position')) {
                this.$el.css('border-bottom', '5px dashed #ddd');
            }
        } else if (application.dndElement.$el.hasClass('descriptor-type')) {
             this.$el.css('border-top', '5px dashed #ddd');
        }

        return false;
    },

    dragLeave: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (application.dndElement.$el.hasClass('descriptor-model-type')) {
            if (this.model.get('position') < application.dndElement.model.get('position')) {
                this.$el.css('border-top', 'initial');
            } else if (this.model.get('position') > application.dndElement.model.get('position')) {
                this.$el.css('border-bottom', 'initial');
            }
        } else if (application.dndElement.$el.hasClass('descriptor-type')) {
             this.$el.css('border-top', 'initial');
        }

        return false;
    },

    drop: function (e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation();
        }

        var elt = application.dndElement;

        if (elt.$el.hasClass('descriptor-type')) {
            // reset borders
            this.$el.css('border-top', 'initial');
            this.$el.css('border-bottom', 'initial');

            var DefinesLabel = Dialog.extend({
                template: require('../templates/descriptormodeltypecreate.html'),

                attributes: {
                    id: "dlg_define_label",
                },

                ui: {
                    label: "#label",
                },

                events: {
                    'input @ui.label': 'onLabelInput',
                },

                initialize: function (options) {
                    DefinesLabel.__super__.initialize.apply(this);
                },

                onLabelInput: function () {
                    this.validateLabel();
                },

                validateLabel: function() {
                    var v = this.ui.label.val();

                    if (v.length < 3) {
                        $(this.ui.label).validateField('failed', gt.gettext('3 characters min'));
                        return false;
                    }

                    $(this.ui.label).validateField('ok');

                    return true;
                },

                onApply: function() {
                    var view = this;
                    var collection = this.getOption('collection');
                    var position = this.getOption('position');
                    var code = this.getOption('code');

                    if (this.validateLabel()) {
                        var to_rshift = [];

                        // server will r-shift position of any model upward this new
                        // do it locally to be consistent
                        for (var model in collection.models) {
                            var dmt = collection.models[model];
                            var p = dmt.get('position');
                            if (p >= position) {
                                dmt.set('position', p+1);
                                to_rshift.push(dmt);
                            }
                        }

                        collection.create({
                            descriptor_type_code: code,
                            label: this.ui.label.val(),
                            position: position
                        }, {
                            wait: true,
                            success: function () {
                                view.remove();
                            },
                            error: function () {
                                $.alert.error(gt.gettext("Unable to create the type of model of descriptor !"));

                                // left shift (undo) for consistency with server
                                for (var i = 0; i < to_rshift.length; ++i) {
                                    to_rshift[i].set('position', to_rshift[i].get('position')-1);
                                }
                            }
                        });
                    }
                },
            });

            var definesLabel = new DefinesLabel({
                collection: this.model.collection,
                position: this.model.get('position'),
                code: elt.model.get('code')
            });

            definesLabel.render();
        }
        else if (elt.$el.hasClass('descriptor-model-type')) {
            // useless drop on himself
            if (this == elt) {
                return false;
            }

            // reset borders
            this.$el.css('border-top', 'initial');
            this.$el.css('border-bottom', 'initial');

            // ajax call
            var position = elt.model.get('position');
            var newPosition = this.model.get('position');
            var modelId = this.model.collection.model_id;
            var collection = this.model.collection;

            $.ajax({
                type: "PUT",
                url: application.baseUrl + 'descriptor/model/' + modelId + '/order/',
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
                    var to_rshift = [];

                    for (var model in collection.models) {
                        var dmt = collection.models[model];
                        if (dmt.get('id') != elt.model.get('id')) {
                            if (dmt.get('position') >= newPosition) {
                                to_rshift.push(dmt);
                            }
                        }
                    }

                    elt.model.set('position', newPosition);

                    var nextPosition = newPosition + 1;

                    for (var i = 0; i < to_rshift.length; ++i) {
                        to_rshift[i].set('position', nextPosition);
                        ++nextPosition;
                    }
                } else {
                    var to_lshift = [];

                    for (var model in collection.models) {
                        var dmt = collection.models[model];
                        if (dmt.get('id') != elt.model.get('id')) {
                            if (dmt.get('position') <= newPosition) {
                                to_lshift.push(dmt);
                            }
                        }
                    }

                    elt.model.set('position', newPosition);

                    var nextPosition = 0;

                    for (var i = 0; i < to_lshift.length; ++i) {
                        to_lshift[i].set('position', nextPosition);
                        ++nextPosition;
                    }
                }

                // need to sort
                collection.sort();
            }).fail(function () {
                $.alert.error(gt.gettext('Unable to reorder the types of model of descriptor'));
            })
        }

        return false;
    },

    editLabel: function() {
        var model = this.model;

        $.ajax({
            type: "GET",
            url: this.model.url() + 'label/',
            dataType: 'json',
        }).done(function (data) {
            var labels = data;

            var ChangeLabel = Dialog.extend({
                template: require('../templates/descriptormodeltypechangelabel.html'),
                templateHelpers: function () {
                    return {
                        labels: labels,
                    };
                },

                attributes: {
                    id: "dlg_change_labels",
                },

                ui: {
                    label: "#descriptor_model_type_labels input",
                },

                events: {
                    'input @ui.label': 'onLabelInput',
                },

                initialize: function (options) {
                    ChangeLabel.__super__.initialize.apply(this);
                },

                onLabelInput: function (e) {
                    this.validateLabel(e);
                },

                validateLabel: function (e) {
                    var v = $(e.target).val();

                    if (v.length > 64) {
                        $(this.ui.label).validateField('failed', gt.gettext('64 characters max'));
                        return false;
                    }

                    $(this.ui.label).validateField('ok');

                    return true;
                },

                validateLabels: function() {
                    $.each($(this.ui.label), function(i, label) {
                        var v = $(this).val();

                        if (v.length > 64) {
                            $(this).validateField('failed', gt.gettext('64 characters max'));
                            return false;
                        }
                    });

                    return true;
                },

                onApply: function () {
                    var view = this;
                    var model = this.getOption('model');

                    var labels = {};

                    $.each($(this.ui.label), function(i, label) {
                        var v = $(this).val();
                        labels[$(label).attr("language")] = v;
                    });

                    if (this.validateLabels()) {
                        $.ajax({
                            type: "PUT",
                            url: model.url() + "label/",
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify(labels)
                        }).done(function() {
                            // manually update the current context label
                            model.set('label', labels[session.language]);
                            $.alert.success(gt.gettext("Successfully labeled !"));
                        }).always(function() {
                            view.remove();
                        });
                    }
                },
            });

            var changeLabel = new ChangeLabel({model: model});
            changeLabel.render();
        });
    },

    toggleMandatory: function() {
        this.model.save({mandatory: !this.model.get('mandatory')}, {patch: true, wait: true});
    },

    toggleSetOnce: function() {
        this.model.save({set_once: !this.model.get('set_once')}, {patch: true, wait: true});
    },

    deleteDescriptorModelType: function() {
        var collection = this.model.collection;
        var position = this.model.get('position');

        this.model.destroy({
            wait: true,
            success: function () {
                for (var model in collection.models) {
                    var dmt = collection.models[model];
                    if (dmt.get('position') > position) {
                        var new_position = dmt.get('position') - 1;
                        dmt.set('position', new_position);
                    }
                }
            }
        });
    },

    editCondition: function() {
        var model = this.model;

        $.ajax({
            type: "GET",
            url: this.model.url() + 'condition/',
            dataType: 'json',
        }).done(function (data) {
            var condition = data;

            var ChangeCondition = Dialog.extend({
                template: require('../templates/descriptormodeltypecondition.html'),
                templateHelpers: function () {
                    return {
                        targets: model.collection.models,
                        condition: condition,
                    };
                },

                attributes: {
                    id: "dlg_change_condition",
                },

                ui: {
                    condition: "#condition",
                    target: "#target",
                    simple_value: "#simple_value",
                    autocomplete_value: "#autocomplete_value",
                    select_value: "#select_value",
                    value_group: "div.value-group",
                    simple_value_group: "#simple_value_group",
                    autocomplete_value_group: "#autocomplete_value_group",
                    select_value_group: "#select_value_group",
                },

                events: {
                    'change @ui.condition': 'onSelectCondition',
                    'change @ui.target': 'onSelectTarget',
                },

                initialize: function (options) {
                    ChangeCondition.__super__.initialize.apply(this);
                },

                onRender: function() {
                    ChangeCondition.__super__.onRender.apply(this);
                    application.descriptor.views.conditions.drawSelect(this.ui.condition);

                    $(this.ui.target).selectpicker({container: 'body', style: 'btn-default'});

                    this.onSelectCondition();
                    this.onSelectTarget();
                },

                toggleCondition: function (condition) {
                    if (condition == 0 || condition == 1) {
                        this.ui.value_group.hide(false);
                    } else {
                        if (this.descriptorTypeFormat.type.startsWith('enum_')) {
                            this.ui.simple_value_group.hide(false);

                            if (this.descriptorTypeFormat.list_type == "dropdown") {
                                this.ui.select_value_group.show(false);
                                this.ui.autocomplete_value_group.hide(false);
                            } else {
                                this.ui.select_value_group.hide(false);
                                this.ui.autocomplete_value_group.show(false);
                            }
                        } else {
                            this.ui.simple_value_group.show(false);
                            this.ui.select_value_group.hide(false);
                            this.ui.autocomplete_value_group.hide(false);
                        }
                    }
                },

                onSelectCondition: function () {
                    var val = this.ui.condition.val();
                    this.toggleCondition(val);
                },

                onSelectTarget: function () {
                    var view = this;
                    var targetId = this.ui.target.val();

                    var model = this.getOption('model').collection.findWhere({id: parseInt(targetId)});
                    if (model) {
                        var descriptorType = new DescriptorTypeModel(
                            {id: model.get('descriptor_type')},
                            {group_id: model.get('descriptor_type_group')}
                        );

                        descriptorType.fetch().then(function() {
                            view.descriptorTypeFormat = descriptorType.get('format');

                            var condition = view.ui.condition.val();
                            view.toggleCondition(condition);

                            if (descriptorType.get('format').type.startsWith('enum_')) {
                                if (descriptorType.get('format').list_type != "dropdown") {
                                    // make an autocomplete widget on simple_value
                                    // @todo
                                    // @todo what about automatic mode ?
                                } else {
                                    // refresh values
                                    // @todo ajax
                                    view.ui.enum_value.find('option').remove();
                                    view.ui.enum_value.selectpicker('refresh');
                                }

                            }
                        });
                    }
                },

                onApply: function () {
                    var view = this;
                    var model = this.getOption('model');

                    var labels = {};

                    $.each($(this.ui.label), function (i, label) {
                        var v = $(this).val();
                        labels[$(label).attr("language")] = v;
                    });

                    if (this.validateLabels()) {
                        // @todo if (condition.defined PUT else POST)
                        /*
                         $.ajax({
                         type: "PUT",
                         url: model.url() + "condition/",
                         dataType: 'json',
                         contentType: "application/json; charset=utf-8",
                         data: JSON.stringify(labels)
                         }).done(function() {
                         // manually update the current context label
                         model.set('label', labels[session.language]);
                         $.alert.success(gt.gettext("Successfully labeled !"));
                         }).always(function() {
                         view.remove();
                         });*/
                    }
                },
            });

            var changeCondition = new ChangeCondition({model: model});
            changeCondition.render();
        });
    }
});

module.exports = View;
