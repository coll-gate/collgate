/**
 * @file descriptorvaluepair.js
 * @brief Value for a type of descriptor view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-08-01
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object descriptor-value',
    template: require('../templates/descriptorvaluepair.html'),
    templateContext: function () {
        // var ctx = this.model;
        // ctx.format = this.model.collection.format;
        //
        // // @todo check with user permission
        // ctx.can_delete = this.getOption('can_delete');
        // ctx.can_modify = this.getOption('can_modify');
        // return ctx;
        return {
            RowActionsBtn: require('../../main/templates/rowactionsbuttons.html')
        };
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: true, title: _t("Edit value0"), event: 'onEditValue0'},
                edit2: {display: true, title: _t("Edit value1"), event: 'onEditValue1'},
                remove: {display: true, event: 'deleteDescriptorValue'}
            }
        }
    },
    ui: {
        delete_btn: '.action.delete',
        edit_btn: '.action.edit',
        edit2_btn: '.action.edit2'
    },

    events: {
        'click @ui.delete_btn': 'deleteDescriptorValue',
        'click @ui.edit_btn': 'onEditValue0',
        'click @ui.edit2_btn': 'onEditValue1'
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        var properties = {
            edit: {disabled: false},
            edit2: {disabled: false},
            remove: {disable: false}
        };

        // @todo check user permissions

        if (!this.getOption('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.edit.disabled = true;
            properties.edit2.disabled = true;
        }

        if (!this.getOption('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    deleteDescriptorValue: function () {
        if (!this.getOption('can_delete') || !session.user.isSuperUser || session.user.isStaff) {
            this.model.destroy({wait: true});
        }
        return false;
    },

    onEditValue0: function () {
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
                        templateContext: function () {
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
                                $(e.target).validateField('failed', _t('characters_min', {count: 1}));
                                return false;
                            } else if (v.length > 64) {
                                $(e.target).validateField('failed', _t('characters_max', {count: 64}));
                                return false;
                            }

                            $(e.target).validateField('ok');

                            return true;
                        },

                        validateValues: function () {
                            $.each($(this.ui.value), function (i, value) {
                                var v = $(this).val();

                                if (v.length < 3) {
                                    $(this).validateField('failed', _t('characters_min', {count: 3}));
                                    return false;
                                } else if (v.length > 64) {
                                    $(this).validateField('failed', _t('characters_max', {count: 64}));
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
                                    $.alert.success(_t("Successfully valued !"));
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
                            $(this.ui.value).validateField('failed', _t('characters_min', {count: 1}));
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
                                    $.alert.success(_t("Successfully changed !"));
                                },
                                error: function () {
                                    $.alert.error(_t("Unable to change the value !"));
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
                return false;
            }
        }
    },

    onEditValue1: function () {
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
                        templateContext: function () {
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
                                $(e.target).validateField('failed', _t('characters_min', {count: 1}));
                                return false;
                            } else if (v.length > 64) {
                                $(e.target).validateField('failed', _t('characters_max', {count: 64}));
                                return false;
                            }

                            $(e.target).validateField('ok');

                            return true;
                        },

                        validateValues: function () {
                            $.each($(this.ui.value), function (i, value) {
                                var v = $(this).val();

                                if (v.length < 3) {
                                    $(this).validateField('failed', _t('characters_min', {count: 3}));
                                    return false;
                                } else if (v.length > 64) {
                                    $(this).validateField('failed', _t('characters_max', {count: 64}));
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
                                    $.alert.success(_t("Successfully valued !"));
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
                            $(this.ui.value).validateField('failed', _t('characters_min', {count: 1}));
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
                                    $.alert.success(_t("Successfully changed !"));
                                },
                                error: function () {
                                    $.alert.error(_t("Unable to change the value !"));
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
                return false;
            }
        }
    }
});

module.exports = View;
