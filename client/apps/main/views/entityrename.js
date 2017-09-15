/**
 * @file entityrename.js
 * @brief A easy Valid/Cancel dialog to change entity name property.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Dialog = require('./dialog');

var View = Dialog.extend({
    attributes: {
        'id': 'dlg_change_rename'
    },
    template: require('../templates/entityrename.html'),
    templateContext: function () {
        return {
            title: this.title
        };
    },

    ui: {
        title: "h4.modal-title",
        name: "input.entity-name",
        confirm: "button.confirm"
    },

    events: {
        'click @ui.confirm': 'onConfirm',
        'input @ui.name': 'onNameInput'
    },

    title: 'Rename',

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        this.mergeOptions(options, ['title']);
    },

    onRender: function () {
        View.__super__.onRender.apply(this);

        this.ui.title.text(this.title);
    },

    onBeforeDestroy: function() {
        View.__super__.onBeforeDestroy.apply(this);
    },

    onNameInput: function () {
        this.validateName();
    },

    validateName: function () {
        var v = this.ui.name.val();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            this.ui.name.validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            this.ui.name.validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (v.length > 128) {
            this.ui.name.validateField('failed', gt.gettext('128 characters max'));
            return false;
        }

        this.ui.name.validateField('ok');

        return true;
    },

    onApply: function () {
        var name = this.ui.name.val();
        var model = this.getOption('model');

        if (this.validateName()) {
            model.save({name: name}, {
                patch: true, wait: true, success: function () {
                    $.alert.success('Done');
                }
            });
            this.trigger('dialog:apply');
            this.destroy();
        }
    }
});

module.exports = View;
