/**
 * @file descriptorvalueordinal.js
 * @brief Value for a type of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-10-28
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
    template: require('../templates/descriptorvalueordinal.html'),
    templateHelpers: function() {
        var ctx = this.model;
        ctx.format = this.model.collection.format;
        ctx.can_delete = this.getOption('can_delete');
        ctx.can_modify = this.getOption('can_modify');
        return ctx;
    },

    ui: {
        edit_label: 'td.edit-descriptor-value0',
    },

    events: {
        'click @ui.edit_label': 'onEditLabel',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
  
    },

    onEditLabel: function() {
        if (this.getOption('can_modify')) {
            var model = this.model;

            $.ajax({
                type: "GET",
                url: this.model.url() + 'value0/',
                dataType: 'json',
            }).done(function (data) {
                var values = data;

                var ChangeValues = Dialog.extend({
                    template: require('../templates/descriptorvaluechangefieldmultiple.html'),
                    templateHelpers: function () {
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
                            $(e.target).validateField('failed', gt.gettext('1 characters min'));
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
                            /*model.save({value0: this.ui.value.val()}, {
                                patch: true,
                                wait: true,
                                success: function () {
                                    view.remove();
                                    $.alert.success(gt.gettext("Successfully changed !"));
                                },
                                error: function () {
                                    $.alert.error(gt.gettext("Unable to change the value !"));
                                }
                            });*/
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
                                view.remove();
                            });
                        }
                    },
                });

                var changeValues = new ChangeValues({model: model});

                changeValues.render();
            });
        }
    },
});

module.exports = View;