/**
 * @file commenthistory.js
 * @brief Dialog that display a list of value from an history of describable entity
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-07-03
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Dialog = require('../../main/views/dialog');

let View = Dialog.extend({
    template: require('../templates/commenthistory.html'),

    templateContext: function () {
        return {
            title: this.title,
            comment: this.comment,
            values: this.entries
        };
    },

    attributes: {
        id: "dlg_describable_show_comment_history"
    },

    initialize: function (options) {
        options || (options = {});

        View.__super__.initialize.apply(this, arguments);

        this.comment = options.comment;
        this.entries = options.entries;

        this.readOnly = options.readOnly;
    },

    onRender: function () {
        View.__super__.onRender.apply(this);

        $("ul.comment-value-history li").css({
            "list-style-type": "none"
        });

        let self = this;

        // setup selector for each value
        let elts = $("li.comment-value span.history-value");

        $.each(elts, function (i, elt) {
            if (!self.readOnly) {
                let value = $(elt).find('input').val().trim();

                $(elt).addClass('element').css('cursor', 'pointer').on('click', function (e) {
                    self.comment.save({'label': self.comment.get('label'), 'value': value}, {patch: true});
                    self.destroy();
                });
            }
        });
    }
});

module.exports = View;
