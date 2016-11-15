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
    templateHelpers: function() {
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
        edit_value1: 'td.edit-descriptor-value1',
    },

    events: {
        'click @ui.delete_descriptor_value': 'deleteDescriptorValue',
        'click @ui.edit_value0': 'onEditValue0',
        'click @ui.edit_value1': 'onEditValue1',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
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
                        $(this.ui.value).validateField('failed', gt.gettext('1 characters min'));
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
                                view.remove();
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
    },

    onEditValue1: function() {
        if (this.getOption('can_modify')) {
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
                        $(this.ui.value).validateField('failed', gt.gettext('1 characters min'));
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
                                view.remove();
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
            changeLabel.ui.value.val(this.model.get('value1'));
        }
    },
});

module.exports = View;