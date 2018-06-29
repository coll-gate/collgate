/**
 * @file commentlist.js
 * @brief Describable entity comments item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
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

        this.model = options.model;
    },

    onRender: function () {
        CommentCreateDialog.__super__.onRender.apply(this);
    },

    onApply: function () {
        if (!this.validateLabel()) {
            return;
        }

        let self = this;
        let model = this.model;
        let label = this.ui.label.val();
        let value = this.ui.value.val();

        let comments = this.model.get('comments');

        for (let i = 0; i < comments.length; ++i) {
            if (comments[i].label === label) {
                $.alert.warning(_("Comment label already exists, try another."));
            }
        }

        comments.push({
           label: label,
           value: value
        });

        this.model.save({comments: comments}, {wait: true, patch: true}).then(function () {
            $.alert.success(_t("Successfully added !"));
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
