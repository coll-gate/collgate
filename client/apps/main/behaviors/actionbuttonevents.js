/**
 * @file actionbuttonevents.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-05-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var ActionBtnEvents = Marionette.Behavior.extend({
    defaults: {
        title:{
            show: gt.gettext('show'),
            edit: gt.gettext('Edit'),
            edit2: gt.gettext('Edit2'),
            manage: gt.gettext('Manage'),
            delete: gt.gettext('Delete')
        }
    },

    ui: {
        actions_btn_group: 'div.action.actions-buttons',
        delete_btn: 'button.action.delete',
        edit_btn: 'button.action.edit',
        edit2_btn: 'button.action.edit2',
        show_btn: 'button.action.show',
        manage_btn: 'button.action.manage'
    },

    events: {
        'mouseenter': 'showActions',
        'mouseleave': 'hideActions'
    },

    onShow: function () {
        this.ui.actions_btn_group.css("display", "none");
        this.ui.show_btn.prop("title", this.options.title.show);
        this.ui.edit_btn.prop("title", this.options.title.edit);
        this.ui.edit2_btn.prop("title", this.options.title.edit2);
        this.ui.manage_btn.prop("title", this.options.title.manage);
        this.ui.delete_btn.prop("title", this.options.title.delete);
        return false;
    },

    showActions: function (e) {
        // e.stopPropagation();
        // e.preventDefault();

        // this.ui.actions_btn_group.show("drop", {direction: 'right'}, 'fast' );
        this.ui.actions_btn_group.css('display', 'flex');
        return false;
    },

    hideActions: function (e) {
        // if (e.currentTarget)
        // e.stopPropagation();
        // e.preventDefault();

        // this.ui.actions_btn_group.hide("drop", {direction: 'right'}, 'fast' );
        this.ui.actions_btn_group.hide();
        return false;
    }

});

module.exports = ActionBtnEvents;