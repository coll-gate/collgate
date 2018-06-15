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
            '<ul class="actions-list">' +
                '<li class="action"><a href="#" name="copy-value">' + _t("Copy value to clipboard") + '</a></li>' +
                '<li class="action"><a href="#" name="open-new" target="_blank">' + _t("View in a new tab/window") + '</a></li>' +
            '</ul>' +
        '</div>'),

    initialize: function(options) {
        options || (options = {});

        Behavior.__super__.initialize.apply(this, arguments);

        this.container = options.container || $('body');
        this.collection = options.collection;
        this.table = options.table;

        this.$el = null;

        $(window).on('keydown', $.proxy(this.onKeyDown, this));
    },

    onRender: function() {
        this.view.ui.tbody.on('contextmenu', $.proxy(this.onBodyContextMenu, this));
        this.view.ui.tbody.on('mouseup', $.proxy(this.onMouseBtnUp, this));

        this.$el = $(this.defaultTemplate());
        this.container.append(this.$el);

        this.$el.find('a[name=copy-value]').parent('li').on('click', $.proxy(this.onCopyValueToClipBoard, this));
        this.$el.find('a[name=open-new]').parent('li').on('click', $.proxy(this.onOpenNewTabWindow, this));

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

    setupLocation: function() {

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
        this.column = options.column;

        let openNew = this.$el.find('a[name=open-new]');
        this.model = null;
        openNew.attr('href', '#');

        if (this.collection && this.cell[0]) {
            // define the url to open a new tab about the element
            let id = parseInt(this.cell.parent().attr('element-id'));

            if (this.column.event) {
                console.log(this.column);
                console.log(this.cell);

                // default uses collection model as target
                this.model = this.collection.get(id);

                // @todo how to according the type of the target model have the good router/url

                let modelUrl = _.isFunction(this.model.url) ? this.model.url() : this.model.url;
                let url = window.location.protocol + '//' + window.location.host + modelUrl.replace(window.application.BASE_URL, window.application.BASE_URL + "app/");

                openNew.attr('href', url);
            }
        }

        // hide the context menu when click on the glass pane
        window.application.main.glassPane('show', {opacity: 0}).on('click', function (e) {
            view.hide();
            return true;
        }).on('contextmenu', function (e) {
            view.hide();
            return false;
        });
    },

    hide: function () {
        window.application.main.glassPane('destroy');
        this.$el.css('display', 'none');
    },

    findModel: function(column, cell) {
        let url = null;

        // define the url to open a new tab about the element
        let id = parseInt(cell.parent().attr('element-id'));

        if (column.event) {
            // default uses collection model as target
            this.model = this.collection.get(id);

            // @todo how to according the type of the target model have the good router/url

            let modelUrl = _.isFunction(this.model.url) ? this.model.url() : this.model.url;
            url = window.location.protocol + '//' + window.location.host + modelUrl.replace(window.application.BASE_URL, window.application.BASE_URL + "app/");
        }

        return url;
    },

    onMouseBtnUp: function(e) {
        if (e.which === 2) {
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
            let url = this.findModel(column, $(e.target));

            if (url) {
                window.open(url, '_blank');
                return false;
            }
        }

        return true;
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
    },

    onOpenNewTabWindow: function(e) {
        this.hide();
    }
});

module.exports = Behavior;
