/**
 * @file cellcontextmenu.js
 * @brief For cell of advanced menu, offers a context menu on right mouse button.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-10-27
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details Actions like copy value to clipboard.
 */

let Marionette = require('backbone.marionette');

let Behavior = Marionette.Behavior.extend({

    defaultTemplate: _.template(
        '<div class="clearfix cell-context-menu" style="position: absolute; display:none;">' +
            '<ul class="actionstep-list">' +
                '<li class="action"><a href="#" name="copy-value">' + _t("Copy value to clipboard") + '</a></li>' +
            '</ul>' +
        '</div>'),

    initialize: function(options) {
        options || (options = {});

        Behavior.__super__.initialize.apply(this, arguments);

        let separator = '<li role="separator" class="divider"></li>';

        this.container = options.container || $('body');
        this.$el = null;

        $(window).on('keydown', $.proxy(this.onKeyDown, this));
    },

    onRender: function() {
        this.view.ui.tbody.on('contextmenu', $.proxy(this.onBodyContextMenu, this));

        this.$el = $(this.defaultTemplate());
        this.container.append(this.$el);

        this.$el.find('a[name=copy-value]').parent('li').on('click', $.proxy(this.onCopyValueToClipBoard, this));
        this.$el.on('contextmenu', function () {
           return false;
        });
    },

    onDestroy: function() {
        if (this.$el) {
            this.$el.remove();
            this.$el = null;
        }

        $(window).off('keydown', $.proxy(this.onKeyDown, this));
    },

    show: function(options) {
        let view = this;

        this.$el.css({
            display: 'block',
            left: options.position.left + 'px',
            top: options.position.top + 'px',
            'z-index': 100000
        }).addClass('glasspane-top-of');

        this.cell = options.cell;

        // hide the context menu when click on the glass pane
        application.main.glassPane('show', {opacity: 0}).on('click', function (e) {
            view.hide();
            return true;
        }).on('contextmenu', function (e) {
            view.hide();
            return false;
        });
    },

    hide: function () {
        application.main.glassPane('destroy');
        this.$el.css('display', 'none');
    },

    onBodyContextMenu: function(e) {
        let col = $(e.target).closest('td');
        if (col.length === 0) {
            return true;
        }

        let columnName = this.view.displayedColumns[col[0].cellIndex];
        let columns = this.view.getOption('columns') || {};
        if (!(columnName in columns)) {
            return true;
        }

        let column = columns[columnName];
        let row = col.parent('tr');

        let position = {
            left: e.clientX,
            top: e.clientY
        };

        this.show({
            row: row,
            column: column,
            cell: $(e.target),
            position: position
        });

        return false;
    },

    onKeyDown: function (e) {
        if (e.key === 'Escape' && this.$el.length) {
            this.hide();
        }
    },

    onCopyValueToClipBoard: function(e) {
        let range = document.createRange();
        range.selectNodeContents(this.cell[0]);

        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        if (!document.execCommand('copy')) {
            console.error("Unable to realise the copy command");
        }

        sel.removeAllRanges();
        this.hide();
    }
});

module.exports = Behavior;
