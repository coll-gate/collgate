/**
 * @file confirmdialog.js
 * @brief A easy Confirm/Cancel dialog for many purposes.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Dialog = require('./dialog');

/**
 * Use the dialog:confirm event of the this dialog to trigger the confirm action.
 */
let View = Dialog.extend({
    attributes: {
        'id': 'dlg_confirm'
    },
    template: require('../templates/confirmdialog.html'),
    templateContext: function () {
        return {
            title: this.title,
            label: this.label
        };
    },

    ui: {
        confirm: "button.confirm",
    },

    events: {
        'click @ui.confirm': 'onConfirm'
    },

    title: 'Untitled',
    label: 'Please confirm your action',

    initialize: function(options) {
        this.mergeOptions(options, ['title', 'label']);

        View.__super__.initialize.apply(this, arguments);
    },

    onRender: function () {
        View.__super__.onRender.apply(this);
    },

    onBeforeDestroy: function() {
        View.__super__.onBeforeDestroy.apply(this);
    },

    onConfirm: function() {
        this.destroy();
        this.trigger('dialog:confirm');
    }
});

module.exports = View;

