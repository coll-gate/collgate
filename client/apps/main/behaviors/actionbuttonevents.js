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
var RowActionButtons = require('../templates/rowactionsbuttons.html');

var ActionBtnEvents = Marionette.Behavior.extend({
    defaults: {
        actions: {
            show: {title: gt.gettext('Show'), display: false},
            edit: {title: gt.gettext('Edit'), display: true},
            edit2: {title: gt.gettext('Edit2'), display: false},
            tag: {title: gt.gettext('Label'), display: false},
            manage: {title: gt.gettext('Manage'), display: false},
            remove: {title: gt.gettext('Delete'), display: true}
        }
    },

    events: {
        'mouseenter': 'showActions',
        'mouseleave': 'hideActions',
        'mouseover': 'overActions',
        'mouseout': 'outActions'
    },
/*
    changeButtonMode: function () {
        var group = this.$el.children('div.row-action-group');
        var numButtons = group.children('div.action.actions-buttons')[0].childElementCount;
        group.css('margin-left', (-numButtons * 24 - 10).toString() + 'px');

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
*/
    overActions: function (e) {
        if (this.view.rowActionButtons && e.relatedTarget && (
            (e.relatedTarget.parentNode && e.relatedTarget.parentNode === this.view.rowActionButtons[0]) ||
            (e.relatedTarget.parentNode && e.relatedTarget.parentNode.parentNode && e.relatedTarget.parentNode.parentNode === this.view.rowActionButtons[0]))) {
            this.view.inButtons = true;
            return false
        }

        if (this.view.rowActionButtons) {
            this.view.inButtons = true;
            return false;
        }

        // follow vertical scrolling
        var container = this.$el.parent().parent().parent();
        container.scroll($.proxy(function(e) {
            var container = this.$el.parent().parent().parent();
            var hasScroll = (container.prop('scrollHeight') - container.prop('clientHeight')) > 0;
            var top = this.$el.position().top;
            var right = 16 + 4 + (hasScroll ? 20 : 0);

            if (this.view.rowActionButtons) {
                this.view.rowActionButtons.css({
                    top: top,
                    right: right
                });
            }
        }, this));

        var hasScroll = (container.prop('scrollHeight') - container.prop('clientHeight')) > 0;
        var top = this.$el.position().top;
        var right = 16 + 4 + (hasScroll ? 20 : 0);

        var defaults = _.clone(this.defaults.actions);
        var actions = _.clone(this.options.actions);

        var options = jQuery.extend({}, defaults, actions);
        var properties = this.view.actionsProperties ? this.view.actionsProperties() : {};

        for (var action in options) {
            if (properties[action] != undefined) {
                if (properties[action].display != undefined) {
                    options[action].display = properties[action].display;
                }

                if (properties[action].disabled != undefined) {
                    options[action].disabled = properties[action].disabled;
                }

                if (properties[action].title != undefined) {
                    options[action].title = properties[action].title;
                }

                if (properties[action].event != undefined) {
                    options[action].event = properties[action].event;
                }
            }
        }

        this.view.rowActionButtons = $(_.template(RowActionButtons(options))());
        this.$el.children('td:last-child').append(this.view.rowActionButtons);

        this.view.rowActionButtons.css({
            display: 'block',
            position: 'absolute',
            top: top,
            right: right
        });

        // bind events
        for (var action in options) {
            if (options[action].event != undefined) {
                this.view.rowActionButtons.children('div').children('button.action[name=' + action + ']').on('click',
                    $.proxy(this.view[options[action].event], this.view));
            }
        }

        // default click
        this.view.rowActionButtons.children('div').on('click', function(e) { return false; });

        return false;
    },

    outActions: function(e) {
        if (!this.view.rowActionButtons) {
            return false;
        }

        if (this.view.rowActionButtons && e.relatedTarget && (
            (e.relatedTarget.parentNode && e.relatedTarget.parentNode === this.view.rowActionButtons[0]) ||
            (e.relatedTarget.parentNode && e.relatedTarget.parentNode.parentNode && e.relatedTarget.parentNode.parentNode === this.view.rowActionButtons[0]))) {
            this.view.inButtons = true;
            return false
        }

        if (this.view.rowActionButtons && !this.view.inButtons) {
            this.view.rowActionButtons.remove();
            this.view.rowActionButtons = null;
            this.view.inButtons = false;
        }

        return false;
    },

    showActions: function(e) {
        if (!this.view.rowActionButtons) {
            return false;
        }

        this.view.inButtons = false;
        return false;
    },

    hideActions: function(e) {
        if (!this.view.rowActionButtons) {
            return false;
        }

        if (this.view.rowActionButtons && this.view.inButtons) {
            this.view.rowActionButtons.remove();
            this.view.rowActionButtons = null;
            this.view.inButtons = false;
        }

        return false;
    }
});

module.exports = ActionBtnEvents;
