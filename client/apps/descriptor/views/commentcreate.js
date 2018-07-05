/**
 * @file commentlist.js
 * @brief Describable entity comments creation
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-28
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Dialog = require('../../main/views/dialog');


let CommentCreateDialog = Dialog.extend({
    template: require('../templates/commentcreate.html'),

    attributes: {
        id: "dlg_create_comment",
    },

    ui: {
        label: "input[name=comment-label]",
        value: "input[name=comment-value]"
    },

    events: {
        'input @ui.label': 'onLabelInput',
    },

    initialize: function (options) {
        CommentCreateDialog.__super__.initialize.apply(this, arguments);

        this.entity = options.entity;
        this.collection = options.collection;
    },

    onRender: function () {
        CommentCreateDialog.__super__.onRender.apply(this);
    },

    onApply: function () {
        if (!this.validateLabel()) {
            return;
        }

        let self = this;
        let label = this.ui.label.val().trim();
        let value = this.ui.value.val().trim();

        this.collection.create({
                label: label,
                value: value
            }, {
                wait: true,
                success: function () {
                    self.destroy();
                    $.alert.success(_t("Successfully added !"));
                },
                error: function () {
                    $.alert.error(_t("Unable to create the comment !"));
            }
        });
    },

    validateLabel: function () {
        let v = this.ui.label.val();

        if (v.length < 3) {
            $(this.ui.label).validateField('failed', _t('characters_min', {count: 3}));
            return false;
        }

        return true;
    },

    onLabelInput: function () {
        if (this.validateLabel()) {
            $(this.ui.label).validateField('ok');
        }
    }
});

module.exports = CommentCreateDialog;
