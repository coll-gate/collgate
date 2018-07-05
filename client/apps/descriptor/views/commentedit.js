/**
 * @file commentedit.js
 * @brief Describable entity comments edit dialog
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-07-02
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Dialog = require('../../main/views/dialog');


let CommentEditDialog = Dialog.extend({
    template: require('../templates/commentedit.html'),

    attributes: {
        id: "dlg_edit_comment",
    },

    ui: {
        value: "input[name=comment-value]"
    },

    initialize: function (options) {
        CommentEditDialog.__super__.initialize.apply(this, arguments);

        this.entity = options.entity;
        this.collection = options.collection;
    },

    onRender: function () {
        CommentEditDialog.__super__.onRender.apply(this);
    },

    onApply: function () {
        let self = this;
        let model = this.getOption('model');
        let value = this.ui.value.val().trim();

        model.save({
                label: model.get('label'),
                value: value
            }, {
            patch: true,
                wait: true,
                success: function () {
                    self.destroy();
                    $.alert.success(_t("Successfully updated !"));
                },
                error: function () {
                    $.alert.error(_t("Unable to modify the comment !"));
            }
        });
    }
});

module.exports = CommentEditDialog;
