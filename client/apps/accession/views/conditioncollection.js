/**
 * @file searchconditionlist.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-07-04
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');
var ConditionView = require('./condition');

var View = Marionette.CollectionView.extend({
    tagName: "condition-list",
    childView: ConditionView,
    childViewOptions: function () {
        return {parent: this}
    },

    checkParenthesis: function () {
        var l_stack = [];
        var r_stack = [];

        this.children.each(function (view) {
            view.ui.right_parenthesis.css('color', 'black').prop('title', '');
            view.ui.left_parenthesis.css('color', 'black').prop('title', '');
            if (view.open_group) {
                l_stack.push(view);
            }
            if (view.close_group) {
                if (l_stack.length === 0) {
                    r_stack.push(view);
                    return false;

                } else {
                    l_stack.pop()
                }
            }
        });

        if (l_stack.length === 0) {
            if (r_stack.length === 0) {
                return true
            } else {
                r_stack[r_stack.length - 1].ui.right_parenthesis.css('color', 'red').prop('title', gt.gettext('Condition group must be closed'));
                return false;
            }
        } else {
            l_stack[l_stack.length - 1].ui.left_parenthesis.css('color', 'red').prop('title', gt.gettext('Condition group must be closed'));
            return false;
        }
    }
});

module.exports = View;