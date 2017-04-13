/**
 * @file descriptorvaluepair.js
 * @brief Value for a type of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-08-01
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorValueModel = require('../models/descriptorvalue');

var Dialog = require('../../main/views/dialog');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-value',
    template: require('../templates/descriptorvaluepair.html'),
    templateHelpers/*templateContext*/: function() {
        var ctx = this.model;
        ctx.format = this.model.collection.format;

        // @todo check with user permission
        ctx.can_delete = this.getOption('can_delete');
        ctx.can_modify = this.getOption('can_modify');
        return ctx;
    },
    ui: {
        delete_descriptor_value: 'th.delete-descriptor-value',
        edit_value0: 'td.edit-descriptor-value0',
        edit_value1: 'td.edit-descriptor-value1'
    },

    events: {
        'click @ui.delete_descriptor_value': 'deleteDescriptorValue',
        'click @ui.edit_value0': 'onEditValue0',
        'click @ui.edit_value1': 'onEditValue1'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    deleteDescriptorValue: function () {
        if (!this.model.get('can_delete') || !session.user.isSuperUser || session.user.isStaff) {
            this.model.destroy({wait: true});
        }
    },

    onEditValue0: function() {
        if (this.getOption('can_modify')) {
            var model = this.model;

            if (model.collection.format['trans']) {
                $.ajax({
                    type: "GET",
                    url: this.model.url() + 'value0/',
                    dataType: 'json',
                }).done(function (data) {
                    var values = data;

                    var ChangeValues = Dialog.extend({
                        template: require('../templates/descriptorvaluechangefieldmultiple.html'),
                        templateHelpers/*templateContext*/: function () {
                            return {
                                values: values,
                            };
                        },

                        attributes: {
                            id: "dlg_change_values",
                        },

                        ui: {
                            value: "#descriptor_value_values input",
                        },

                        events: {
                            'input @ui.value': 'onValueInput',
                        },

                        initialize: function (options) {
                            ChangeValues.__super__.initialize.apply(this);
                        },

                        onValueInput: function (e) {
                            this.validateValue(e);
                        },

                        validateValue: function (e) {
                            var v = $(e.target).val();

                            if (v.length < 1) {
                                $(e.target).validateField('failed', gt.gettext('1 character min'));
                                return false;
                            } else if (v.length > 64) {
                                $(e.target).validateField('failed', gt.gettext('64 characters max'));
                                return false;
                            }

                            $(e.target).validateField('ok');

                            return true;
                        },

                        validateValues: function () {
                            $.each($(this.ui.value), function (i, value) {
                                var v = $(this).val();

                                if (v.length < 3) {
                                    $(this).validateField('failed', gt.gettext('3 characters min'));
                                    return false;
                                } else if (v.length > 64) {
                                    $(this).validateField('failed', gt.gettext('64 characters max'));
                                    return false;
                                }
                            });

                            return true;
                        },

                        onApply: function () {
                            var view = this;
                            var model = this.getOption('model');

                            var values = {};

                            $.each($(this.ui.value), function (i, value) {
                                var v = $(this).val();
                                values[$(value).attr("language")] = v;
                            });

                            if (this.validateValues()) {
                                $.ajax({
                                    type: "PUT",
                                    url: model.url() + "value0/",
                                    dataType: 'json',
                                    contentType: "application/json; charset=utf-8",
                                    data: JSON.stringify(values)
                                }).done(function () {
                                    // manually update the current context value
                                    model.set('value0', values[session.language]);
                                    $.alert.success(gt.gettext("Successfully valued !"));
                                }).always(function () {
                                    view.destroy();
                                });
                            }
                        },
                    });

                    var changeValues = new ChangeValues({model: model});
                    changeValues.render();
                });
            } else {
                var ChangeLabel = Dialog.extend({
                    template: require('../templates/descriptorvaluechangefield.html'),

                    attributes: {
                        id: "dlg_change_value",
                    },

                    ui: {
                        value: "#value",
                    },

                    events: {
                        'input @ui.value': 'onValueInput',
                    },

                    initialize: function (options) {
                        ChangeLabel.__super__.initialize.apply(this);

                    },

                    onValueInput: function () {
                        this.validateValue();
                    },

                    validateValue: function () {
                        var v = this.ui.value.val();

                        if (v.length < 1) {
                            $(this.ui.value).validateField('failed', gt.gettext('1 character min'));
                            return false;
                        }

                        $(this.ui.value).validateField('ok');

                        return true;
                    },

                    onApply: function () {
                        var view = this;
                        var model = this.getOption('model');

                        if (this.validateValue()) {
                            model.save({value0: this.ui.value.val()}, {
                                patch: true,
                                wait: true,
                                success: function () {
                                    view.destroy();
                                    $.alert.success(gt.gettext("Successfully changed !"));
                                },
                                error: function () {
                                    $.alert.error(gt.gettext("Unable to change the value !"));
                                }
                            });
                        }
                    },
                });

                var changeLabel = new ChangeLabel({
                    model: this.model,
                });

                changeLabel.render();
                changeLabel.ui.value.val(this.model.get('value0'));
            }
        }
    },

    onEditValue1: function() {
        if (this.getOption('can_modify')) {
            var model = this.model;

            if (model.collection.format['trans']) {
                $.ajax({
                    type: "GET",
                    url: this.model.url() + 'value1/',
                    dataType: 'json',
                }).done(function (data) {
                    var values = data;

                    var ChangeValues = Dialog.extend({
                        template: require('../templates/descriptorvaluechangefieldmultiple.html'),
                        templateHelpers/*templateContext*/: function () {
                            return {
                                values: values,
                            };
                        },

                        attributes: {
                            id: "dlg_change_values",
                        },

                        ui: {
                            value: "#descriptor_value_values input",
                        },

                        events: {
                            'input @ui.value': 'onValueInput',
                        },

                        initialize: function (options) {
                            ChangeValues.__super__.initialize.apply(this);
                        },

                        onValueInput: function (e) {
                            this.validateValue(e);
                        },

                        validateValue: function (e) {
                            var v = $(e.target).val();

                            if (v.length < 1) {
                                $(e.target).validateField('failed', gt.gettext('1 character min'));
                                return false;
                            } else if (v.length > 64) {
                                $(e.target).validateField('failed', gt.gettext('64 characters max'));
                                return false;
                            }

                            $(e.target).validateField('ok');

                            return true;
                        },

                        validateValues: function () {
                            $.each($(this.ui.value), function (i, value) {
                                var v = $(this).val();

                                if (v.length < 3) {
                                    $(this).validateField('failed', gt.gettext('3 characters min'));
                                    return false;
                                } else if (v.length > 64) {
                                    $(this).validateField('failed', gt.gettext('64 characters max'));
                                    return false;
                                }
                            });

                            return true;
                        },

                        onApply: function () {
                            var view = this;
                            var model = this.getOption('model');

                            var values = {};

                            $.each($(this.ui.value), function (i, value) {
                                var v = $(this).val();
                                values[$(value).attr("language")] = v;
                            });

                            if (this.validateValues()) {
                                $.ajax({
                                    type: "PUT",
                                    url: model.url() + "value1/",
                                    dataType: 'json',
                                    contentType: "application/json; charset=utf-8",
                                    data: JSON.stringify(values)
                                }).done(function () {
                                    // manually update the current context value
                                    model.set('value1', values[session.language]);
                                    $.alert.success(gt.gettext("Successfully valued !"));
                                }).always(function () {
                                    view.destroy();
                                });
                            }
                        },
                    });

                    var changeValues = new ChangeValues({model: model});
                    changeValues.render();
                });
            } else {
                var ChangeLabel = Dialog.extend({
                    template: require('../templates/descriptorvaluechangefield.html'),

                    attributes: {
                        id: "dlg_change_value",
                    },

                    ui: {
                        value: "#value",
                    },

                    events: {
                        'input @ui.value': 'onValueInput',
                    },

                    initialize: function (options) {
                        ChangeLabel.__super__.initialize.apply(this);

                    },

                    onValueInput: function () {
                        this.validateValue();
                    },

                    validateValue: function () {
                        var v = this.ui.value.val();

                        if (v.length < 1) {
                            $(this.ui.value).validateField('failed', gt.gettext('1 character min'));
                            return false;
                        }

                        $(this.ui.value).validateField('ok');

                        return true;
                    },

                    onApply: function () {
                        var view = this;
                        var model = this.getOption('model');

                        if (this.validateValue()) {
                            model.save({value1: this.ui.value.val()}, {
                                patch: true,
                                wait: true,
                                success: function () {
                                    view.destroy();
                                    $.alert.success(gt.gettext("Successfully changed !"));
                                },
                                error: function () {
                                    $.alert.error(gt.gettext("Unable to change the value !"));
                                }
                            });
                        }
                    }
                });

                var changeLabel = new ChangeLabel({
                    model: this.model,
                });

                changeLabel.render();
                changeLabel.ui.value.val(this.model.get('value1'));
            }
        }
    },
});

module.exports = View;