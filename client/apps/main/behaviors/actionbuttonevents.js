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
        title_show: gt.gettext('Show'),
        title_edit: gt.gettext('Edit'),
        title_edit2: gt.gettext('Edit2'),
        title_tag: gt.gettext('Label'),
        title_manage: gt.gettext('Manage'),
        title_delete: gt.gettext('Delete')
    },

    events: {
        'mouseenter': 'showActions',
        'mouseleave': 'hideActions',
        'destroy': 'destroyEvents'
    },

    changeButtonMode: function () {
        var group = this.$el.children('div.row-action-group');
        var nb_buttons = group.children('div.action.actions-buttons')[0].childElementCount;
        group.css('margin-left', (-nb_buttons * 24 - 10).toString() + 'px');

        // $(window).on('resize', function change_btn_mode() {
        //     var btn_size = null;
        //     if ($(window).width() <= 1024) {
        //         group.css("display", "block");
        //         group.children('div.action.actions-buttons').removeClass('btn-group-xs');
        //         group.children('div.action.actions-buttons').addClass('btn-group-md');
        //         btn_size = 42;
        //     } else {
        //         group.css("display", "none");
        //         group.children('div.action.actions-buttons').removeClass('btn-group-md');
        //         group.children('div.action.actions-buttons').addClass('btn-group-xs');
        //         btn_size = 24;
        //     }
        //
        //     // Calculate left margin according to the number of buttons
        //     group.css('margin-left', (-nb_buttons * btn_size - 10).toString() + 'px');
        //     console.log(btn_size);
        // });
        //
        // $(window).trigger('resize');
        return false;
    },

    onDomRefresh: function () {
        var group = this.$el.children('div.row-action-group').children('div.action.actions-buttons');
        this.changeButtonMode();

        group.children('button.action.show').prop("title", this.options.title_show);
        group.children('button.action.edit').prop("title", this.options.title_edit);
        group.children('button.action.edit2').prop("title", this.options.title_edit2);
        group.children('button.action.tag').prop("title", this.options.title_tag);
        group.children('button.action.manage').prop("title", this.options.title_manage);
        group.children('button.action.delete').prop("title", this.options.title_delete);
        return false;
    },

    showActions: function (e) {
        var group = this.$el.children('div.row-action-group');
        group.css("display", "block");
        return false;
    },

    hideActions: function (e) {
        // if ($(window).width() > 1024) {
            var group = this.$el.children('div.row-action-group');
            group.css("display", "none");
        // }
        return false;
    }

});

module.exports = ActionBtnEvents;