/**
 * @file confirmdialog.js
 * @brief A easy Confirm/Cancel dialog for many purposes.
 * @author Frederic SCHERMA
 * @date 2017-02-01
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Dialog = require('./dialog');

/**
 * Use the dialog:confirm event of the this dialog to trigger the confirm action.
 */
var View = Dialog.extend({
    attributes: {
        'id': 'dlg_confirm'
    },
    template: require('../templates/confirmdialog.html'),
    templateHelpers/*templateContext*/: function () {
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
