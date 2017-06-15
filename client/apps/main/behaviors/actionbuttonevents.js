/**
 * @file actionbuttonevents.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095), Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-05-19
 * @copyright Copyright (c) 2017 INRA/CIRAD
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
        // });
        //
        // $(window).trigger('resize');
        return false;
    },
*/
    onDestroy: function() {
        if (application.tmp.lastActionButtonEvents === this) {
            application.tmp.lastActionButtonEvents = null;
        }

        if (this.rowActionButtons) {
            this.rowActionButtons.remove();
        }
    },

    overActions: function (e) {
        // delete a previous one not clean (issue on chrome)
        if (application.tmp.lastActionButtonEvents !== this) {
            var last = application.tmp.lastActionButtonEvents;

            if (last && last.rowActionButtons) {
                last.inButtons = last.inRow = false;
                last.rowActionButtons.remove();
            }

            application.tmp.lastActionButtonEvents = this;
        }

        if (this.rowActionButtons && e.relatedTarget && (
            (e.relatedTarget.parentNode && e.relatedTarget.parentNode === this.rowActionButtons[0]) ||
            (e.relatedTarget.parentNode && e.relatedTarget.parentNode.parentNode && e.relatedTarget.parentNode.parentNode === this.rowActionButtons[0]))) {
            this.inButtons = true;
        } else {
            this.inButtons = false;
        }

        if (this.rowActionButtons) {
             return false;
        }

        var actions = this.options.actions;
        var options = _.deepClone(this.defaults.actions);

        var properties = this.view.actionsProperties ? this.view.actionsProperties() : {};

        for (var action in options) {
            if (actions[action] != undefined) {
                if (actions[action].display != undefined) {
                    options[action].display = actions[action].display;
                }

                if (actions[action].disabled != undefined) {
                    options[action].disabled = actions[action].disabled;
                }

                if (actions[action].title != undefined) {
                    options[action].title = actions[action].title;
                }

                if (actions[action].event != undefined) {
                    options[action].event = actions[action].event;
                }
            }

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

        var top = this.$el.children('td:last-child').html() === "" ? 0 : -20;

        this.rowActionButtons = $(_.template(RowActionButtons(options))());
        this.$el.children('td:last-child').append(this.rowActionButtons);

        this.rowActionButtons.css({
            display: 'block'
        });

        // adjust top when content into the column
        this.rowActionButtons.children('div').css('top', top);

        // bind events
        for (var action in options) {
            if (options[action].event != undefined) {
                this.rowActionButtons.children('div').children('button.action[name=' + action + ']').on('click',
                    $.proxy(this.view[options[action].event], this.view));
            }
        }

        // default click
        this.rowActionButtons.children('div').on('click', function(e) { return false; });

        return false;
    },

    outActions: function(e) {
        if (this.rowActionButtons && e.relatedTarget && (
            (e.relatedTarget.parentNode && e.relatedTarget.parentNode === this.rowActionButtons[0]) ||
            (e.relatedTarget.parentNode && e.relatedTarget.parentNode.parentNode && e.relatedTarget.parentNode.parentNode === this.rowActionButtons[0]))) {
            this.inButtons = true;
        } else {
            this.inButtons = false;
        }

        if (this.rowActionButtons && !this.inButtons && !this.inRow) {
            this.rowActionButtons.remove();
            this.rowActionButtons = null;
        }

        return false;
    },

    showActions: function(e) {
        this.inRow = true;
        return false;
    },

    hideActions: function(e) {
        this.inRow = false;

        if (this.rowActionButtons && !this.inButtons && !this.inRow) {
            this.rowActionButtons.remove();
            this.rowActionButtons = null;
        }

        return false;
    }
});

module.exports = ActionBtnEvents;
