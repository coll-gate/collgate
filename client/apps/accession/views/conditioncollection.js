/**
 * @file searchconditionlist.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-07-04
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let ConditionView = require('./condition');

let View = Marionette.CollectionView.extend({
    tagName: "condition-list",
    childView: ConditionView,
    childViewOptions: function () {
        return {parent: this}
    },

    validParenthesis: function () {
        let $error_msg = this.$el.parents('.modal-content').find('#error-msg');
        let $search_btn = this.$el.parents('.modal-content').find('button.search');
        let $save_btn = this.$el.parents('.modal-content').find('button.save');

        $error_msg.hide();

        let l_stack = [];
        let r_stack = [];
        let l_invalid_depth = [];
        let r_invalid_depth = [];
        let depth = 0;

        this.children.each(function (view) {
            view.ui.right_parenthesis.css('color', 'black').prop('title', '');
            view.ui.left_parenthesis.css('color', 'black').prop('title', '');

            for (let i=0; i < view.open_group; i++ ) {
                l_stack.push(view);
                depth++;
                if (depth >= 3) {
                    l_invalid_depth.push(view);
                }
            }

            for (let i=0; i < view.close_group; i++ ) {
                if (l_stack.length === 0) {
                    r_stack.push(view);
                    return false;
                } else {
                    l_stack.pop()
                }
                if (depth >= 3) {
                    r_invalid_depth.push(view);
                }
                depth--;
            }
        });

        if (l_invalid_depth.length !== 0 || r_invalid_depth.length !== 0) {
            $error_msg.html('<span class="fa fa-times"></span> ' + _t('maximum depth of sub conditions groups si 3'));
            $error_msg.show();
            if (l_invalid_depth.length !== 0) {
                $.each(l_invalid_depth, function (view_index) {
                    l_invalid_depth[view_index].ui.left_parenthesis.css('color', 'red').prop('title', _t('condition depth too high'));
                });
            }
            if (r_invalid_depth.length !== 0) {
                $.each(r_invalid_depth, function (view_index) {
                    r_invalid_depth[view_index].ui.right_parenthesis.css('color', 'red').prop('title', _t('condition depth too high'));
                });
            }
            $search_btn.prop('disabled', true);
            $save_btn.prop('disabled', true);
            return false;
        }

        if (l_stack.length === 0) {
            if (r_stack.length === 0) {
                $search_btn.prop('disabled', false);
                $save_btn.prop('disabled', false);
                return true
            } else {
                r_stack[r_stack.length - 1].ui.right_parenthesis.css('color', 'red').prop('title', _t('Condition group must be closed'));
                $error_msg.html('<span class="fa fa-times"></span> ' + _t('invalid conditions groups'));
                $error_msg.show();
                $search_btn.prop('disabled', true);
                $save_btn.prop('disabled', true);
                return false;
            }
        } else {
            l_stack[l_stack.length - 1].ui.left_parenthesis.css('color', 'red').prop('title', _t('Condition group must be closed'));
            $error_msg.html('<span class="fa fa-times"></span> ' + _t('invalid conditions groups'));
            $error_msg.show();
            $search_btn.prop('disabled', true);
            $save_btn.prop('disabled', true);
            return false;
        }
    }
});

module.exports = View;