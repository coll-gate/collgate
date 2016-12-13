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

var DisplayDescriptor = require('../widgets/displaydescriptor');


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
        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

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
                    simple_value_icon: "#simple_value_icon",
                    autocomplete_value_group: "#autocomplete_value_group",
                    select_value_group: "#select_value_group",
                    unit: "#unit",
                    destroy: "button.destroy"
                },

                events: {
                    'change @ui.condition': 'onSelectCondition',
                    'change @ui.target': 'onSelectTarget',
                    'click @ui.destroy': 'onDestroyCondition',
                },

                initialize: function (options) {
                    ChangeCondition.__super__.initialize.apply(this);
                },

                onRender: function() {
                    ChangeCondition.__super__.onRender.apply(this);
                    application.descriptor.views.conditions.drawSelect(this.ui.condition);

                    $(this.ui.target).selectpicker({container: 'body', style: 'btn-default'});

                    // initial values set after getting them from dropdown or autocomplete initialization
                    var condition = this.getOption('condition');
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
                    ChangeCondition.__super__.onBeforeDestroy.apply(this);
                    this.ui.condition.selectpicker('destroy');
                    this.ui.target.selectpicker('destroy');
                },

                toggleCondition: function (condition) {
                    if (condition == 0 || condition == 1) {
                        this.ui.value_group.hide(false);
                    } else if (this.descriptorTypePromise) {
                        // sync with descriptorType
                        var view = this;

                        this.descriptorTypePromise.then(function() {
                            var format = view.descriptorType.get('format');

                            if (format.type.startsWith('enum_')) {
                                view.ui.simple_value_group.hide(false);

                                if (format.list_type == "dropdown") {
                                    view.ui.select_value_group.show(false);
                                    view.ui.autocomplete_value_group.hide(false);
                                } else {
                                    view.ui.select_value_group.hide(false);
                                    view.ui.autocomplete_value_group.show(false);
                                }
                            } else if (format.type == "entity") {
                                view.ui.simple_value_group.hide(false);
                                view.ui.select_value_group.hide(false);
                                view.ui.autocomplete_value_group.show(false);
                            } else if (format.type == "boolean") {
                                view.ui.simple_value_group.hide(false);
                                view.ui.select_value_group.show(false);
                                view.ui.autocomplete_value_group.hide(false);
                            } else if (format.type == "ordinal") {
                                if ((format.range[1] - format.range[0] + 1) <= 256) {
                                    view.ui.simple_value_group.hide(false);
                                    view.ui.select_value_group.show(false);
                                    view.ui.autocomplete_value_group.hide(false);
                                } else {
                                    view.ui.simple_value_group.show(false);
                                    view.ui.select_value_group.hide(false);
                                    view.ui.autocomplete_value_group.hide(false);
                                }
                            } else {
                                view.ui.simple_value_group.show(false);
                                view.ui.select_value_group.hide(false);
                                view.ui.autocomplete_value_group.hide(false);
                            }
                        });
                    };
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
                        this.descriptorType = new DescriptorTypeModel(
                            {id: model.get('descriptor_type')},
                            {group_id: model.get('descriptor_type_group')}
                        );

                        this.descriptorTypePromise = this.descriptorType.fetch().then(function() {
                            var format = view.descriptorType.get('format');

                            var condition = view.ui.condition.val();
                            view.toggleCondition(condition);

                            view.ui.select_value.find('option').remove();

                            if (format.unit === "custom") {
                                view.ui.unit.html(format.custom_unit)
                            } else {
                                view.ui.unit.html(format.unit)
                            }

                            // destroy a previous datetimepicker
                            if (view.ui.simple_value.parent().data('DateTimePicker')) {
                                view.ui.simple_value.parent().data('DateTimePicker').destroy();
                            }

                            if (format.type.startsWith('enum_')) {
                                if (format.list_type == "autocomplete") {
                                    DisplayDescriptor.initAutocomplete(
                                        view.descriptorType.get('format'),
                                        view.descriptorType.url(),
                                        view,
                                        view.ui.autocomplete_value,
                                        view.definesValues,
                                        view.defaultValues);
                                } else {
                                    DisplayDescriptor.initDropdown(
                                        view.descriptorType.get('format'),
                                        view.descriptorType.url(),
                                        view,
                                        view.ui.select_value,
                                        view.definesValues,
                                        view.defaultValues);
                                }
                            } else if (format.type === 'entity') {
                                var url = application.baseUrl + format.model.replace('.', '/') + '/';

                                DisplayDescriptor.initEntitySelect(
                                        view.descriptorType.get('format'),
                                        url,
                                        view,
                                        view.ui.autocomplete_value,
                                        view.definesValues,
                                        view.defaultValues);
                            } else if (format.type === 'boolean') {
                                DisplayDescriptor.initBoolean(
                                    view.descriptorType.get('format'),
                                    view,
                                    view.ui.select_value,
                                    view.definesValues,
                                    view.defaultValues);
                            } else if (format.type === 'ordinal') {
                                DisplayDescriptor.initOrdinal(
                                    view.descriptorType.get('format'),
                                    view,
                                    view.ui.select_value,
                                    view.definesValues,
                                    view.defaultValues);
                            } else if (format.type === 'date') {
                                DisplayDescriptor.initDate(
                                    view.descriptorType.get('format'),
                                    view,
                                    view.ui.simple_value.parent(),
                                    view.definesValues,
                                    view.defaultValues);

                                // glyphicon and pointer
                                view.ui.simple_value_icon.removeClass().addClass("glyphicon glyphicon-calendar")
                                    .parent().css('cursor', 'pointer');
                            } else if (format.type === 'time') {
                                 DisplayDescriptor.initTime(
                                    view.descriptorType.get('format'),
                                    view,
                                    view.ui.simple_value.parent(),
                                    view.definesValues,
                                    view.defaultValues);

                                 // glyphicon and pointer
                                 view.ui.simple_value_icon.removeClass().addClass("glyphicon glyphicon-time")
                                     .parent().css('cursor', 'pointer');
                            } else if (format.type === 'datetime') {
                                DisplayDescriptor.initDateTime(
                                    view.descriptorType.get('format'),
                                    view,
                                    view.ui.simple_value.parent(),
                                    view.definesValues,
                                    view.defaultValues);

                                // glyphicon and pointer
                                view.ui.simple_value_icon.removeClass().addClass("glyphicon glyphicon-calendar")
                                    .parent().css('cursor', 'pointer');
                            } else {
                                view.ui.simple_value.val("");

                                // glyphicon and pointer
                                view.ui.simple_value_icon.removeClass()
                                    .addClass("glyphicon glyphicon-cog").parent().css('cursor', 'initial');
                            }

                            if (view.definesValues) {
                                view.definesValues = false;
                                view.defaultValues = null;
                            }
                        });
                    }
                },

                onDestroyCondition: function() {
                    var view = this;
                    var model = this.getOption('model');
                    var condition = this.getOption('condition');

                    $.ajax({
                        type: "DELETE",
                        url: model.url() + "condition/",
                        contentType: "application/json; charset=utf-8",
                    }).done(function() {
                        $.alert.success(gt.gettext("Successfully removed !"));
                    }).always(function() {
                        view.remove();
                    });
                },

                onApply: function () {
                    var view = this;
                    var model = this.getOption('model');
                    var condition = this.getOption('condition');

                    var data = {
                        target: parseInt(this.ui.target.val()),
                        condition: parseInt(this.ui.condition.val()),
                    };

                    if (!this.descriptorType) {
                        return this.onDestroyCondition();
                    }

                    // take value
                    var format = this.descriptorType.get('format');
                    if (data.condition == 2 || data.condition == 3) {
                        if ((format.type.startsWith('enum_') && format.list_type == "autocomplete") || (format.type === "entity")) {
                            data.values = [this.ui.autocomplete_value.val()];
                        } else if (format.list_type === "dropdown" || format.type === 'boolean' || format.type === 'ordinal') {
                            data.values = [this.ui.select_value.val()];
                        } else if (format.type === "date") {
                            // format to YYYYMMDD date
                            data.values = [$("#simple_value").parent().data('DateTimePicker').viewDate().format("YYYYMMDD")];
                        } else if (format.type === "time") {
                            // format to HH:mm:ss time
                            data.values = [$("#simple_value").parent().data('DateTimePicker').viewDate().format("HH:mm:ss")]; // .MS
                        } else if (format.type === "datetime") {
                            // format to iso datetime
                            data.values = [$("#simple_value").parent().data('DateTimePicker').viewDate().format()];
                        } else {
                            data.values = [this.ui.simple_value.val()];
                        }
                    } else {
                        data.values = [];
                    }

                    // depending if the condition previously existed: post or put.
                    if (condition.defined) {
                        $.ajax({
                            type: "PUT",
                            url: model.url() + "condition/",
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify(data)
                        }).done(function() {
                            $.alert.success(gt.gettext("Successfully defined !"));
                        }).always(function() {
                            view.remove();
                        });
                    } else {
                        $.ajax({
                            type: "POST",
                            url: model.url() + "condition/",
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify(data)
                        }).done(function () {
                            $.alert.success(gt.gettext("Successfully defined !"));
                        }).always(function () {
                            view.remove();
                        });
                    }
                },
            });

            var changeCondition = new ChangeCondition({model: model, condition: condition});
            changeCondition.render();
        });
    }
});

module.exports = View;
