/**
 * @file scrollview.js
 * @brief Base view for scrollable view with a cursor collection
 * @author Frederic SCHERMA
 * @date 2016-10-07
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.CompositeView.extend({
    rowHeight: 1+8+20+8,
    scrollViewInitialized: false,
    selectedColumns: [],
    userSettingName: null,

    attributes: {
    },

    ui: {
        table: 'table.table',
        thead: 'table.table thead',
        tbody: 'table.table tbody',
        add_column: 'span.add-column',
        add_column_menu: 'div.add-column-menu',
        remove_column: 'span.remove-column',
        sortby_column: 'span.sortby-column'
    },

    events: {
        'click @ui.add_column': 'onAddColumnAction',
        'click @ui.add_column_column': 'onAddColumn'
    },

    constructor: function() {
        var prototype = this.constructor.prototype;

        this.events = {};
        this.defaultOptions = {};
        this.ui = {};
        this.attributes = {};
        this.className = "";

        while (prototype) {
            if (prototype.hasOwnProperty("events")) {
                _.defaults(this.events, prototype.events);
            }
            if (prototype.hasOwnProperty("defaultOptions")) {
                _.defaults(this.defaultOptions, prototype.defaultOptions);
            }
            if (prototype.hasOwnProperty("ui")) {
                _.defaults(this.ui, prototype.ui);
            }
            if (prototype.hasOwnProperty("attributes")) {
                _.defaults(this.attributes, prototype.attributes);
            }
            if (prototype.hasOwnProperty("className")) {
                this.className += " " + prototype.className;
            }
            prototype = prototype.constructor.__super__;
        }

        Marionette.CompositeView.apply(this, arguments);
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        options || (options = {columns: {}});

        this.listenTo(this.collection, 'reset', this.onResetCollection, this);
        this.listenTo(this.collection, 'sync', this.onCollectionSync, this);

        if (this.userSettingName) {
            this.selectedColumns = application.getUserSetting(this.userSettingName);
        }

        // process columns
        this.displayedColumns = [];

        for (var i = 0; i < this.selectedColumns.length; ++i) {
            var columnName = this.selectedColumns[i].name;
            if (options.columns[columnName]) {
                this.displayedColumns.push({
                    name: columnName,
                    label: options.columns[columnName].label,
                    query: options.columns[columnName].query || false,
                    format: options.columns[columnName].format
                });
            }
        }
    },

    getScrollElement: function() {
        var scrollElement = this.$el.parent();

        if (this.$el.css('overflow-y') === "auto") {
            scrollElement = this.$el;
        }

        return scrollElement;
    },

    isDisplayed: function() {
        return this.ui.table.offsetParent().length && this.ui.table.offsetParent()[0].nodeName !== 'HTML';
    },

    onResetCollection: function() {
        this.lastModels = null;

        // reset scrolling
        var scrollElement = this.getScrollElement();
        scrollElement.scrollTop(0);
    },

    onDomRefresh: function() {
        // we can only init here because we need to known the parent container
        if (!this.scrollViewInitialized) {
            // pagination on scrolling using the direct parent as scroll container
            var scrollElement = this.getScrollElement();

            scrollElement.scroll($.proxy(function (e) {
                this.scroll(e);
            }, this));

            // and sticky header on table
            // if (!this.ui.table.hasClass('table-advanced')) {
            //     $(this.ui.table).stickyTableHeaders({scrollableArea: scrollElement});
            // }

            // add the sizer container
            var sizerContainer = $('<div></div>');
            sizerContainer.addClass('sizer-container');

            this.ui.thead.append(sizerContainer);

            // column resizing
            $("body").on('mousemove', $.proxy(this.onResizeColumnMove, this));
            $("body").on('mouseup', $.proxy(this.onResizeColumnFinish, this));

            this.scrollViewInitialized = true;
        }

        // add menu column close on event
        var contextMenu = this.ui.add_column_menu;
        var contextMenuBtn = this.ui.add_column;

        if (contextMenu.length && contextMenuBtn.length) {
            $('body').on('click', function(e) {
                if (e.target !== contextMenuBtn[0]) {
                    contextMenu.hide();
                    return true;
                }
                return false;
            });

            contextMenu.on("click", "a", function () {
                contextMenu.hide();
            });
        }

        // if displayed adjust columns width
        if (this.isDisplayed()) {
            this.updateColumnsWidth();
        }
    },

    onShowTab: function(tabView) {
        if (this.isDisplayed()) {
            this.updateColumnsWidth();
        }
    },

    updateColumnsWidth: function() {
        if (!this.ui.table.hasClass('table-advanced')) {
            return;
        }

        // not displayed at this time, wait for a visibility signal (onShowTab or onDomRefresh)
        if (!this.isDisplayed()) {
            return;
        }

        // should be done after the columns content update (refresh)
        var columnsWidth = [];
        var firstBodyRaw = this.ui.tbody.children('tr:first-child');
        var zero = false;
        var view = this;

        var headerRows = this.ui.thead.find('tr th');
        var rows = firstBodyRaw.children('th,td');

        // no content
        if (rows.length === 0) {
            $.each(headerRows, function(i, element) {
                var el = $(element);
                var div = el.children('div');

                // resize title column
                if (div && !el.hasClass('glyph-fixed-column')) {
                    div.width(el.width()-1);
                }

                // @todo
                if (el.hasClass('title-column')) {
                    el.css('min-width', div.width()+1)
                }
            });

            return;
        }

        // reset in auto width (browser auto-size)
        var numColumns = headerRows.length;

        $.each(headerRows, function(i, element) {
            var el = $(element);
            if (!el.hasClass("glyph-fixed-column")) {
                el.width('auto');
            }

            // try to keep as possible the title entirely visible
            if (el.hasClass('title-column')) {
                el.children('div').width('auto');
                el.css('min-width', el.children('div').width()+1 + 'px');
            }

            // if not exits add the column sizer on the left of the next one
            if (i < numColumns-1) {
                var nextColumn = $(headerRows[i+1]);

                if (nextColumn.children('div').children('div.column-sizer').length === 0) {
                    var sizer = $('<div></div>');
                    sizer.addClass('column-sizer');

                    var border = $('<div></div>');
                    sizer.append(border);

                    nextColumn.children('div').prepend(sizer);

                    if (!el.hasClass('glyph-fixed-column')) {
                        sizer.addClass('active');

                        sizer.on('mousedown', $.proxy(view.onResizeColumnBegin, view));
                    }
                }
            }
        });

        $.each(rows, function(i, element) {
            var width = $(element).width();
            columnsWidth.push(width);

            zero = width <= 0;
        });

        // fix case of 0 width columns, when they are not ready
        if (zero) {
            return;
        }

        $.each(headerRows, function(i, element) {
            var el = $(element);
            var div = el.children('div');

            // resize title column except placeholder columns
            if (div.length && !el.hasClass('glyph-fixed-column')) {
                // count border left (should does not set it for first column)
                el.width(columnsWidth[i]+1);
                div.width(columnsWidth[i]);
            }
        });
    },

    onResizeColumnBegin: function (e) {
        var sizer = $(e.currentTarget);

        // get the previous column
        var column = sizer.parent().parent();
        var columns = column.parent().find('th');
        var view = this;

        this.resizingColumnLeft = null;

        $.each(columns, function(i, element) {
            if ($(element).attr('name') === column.attr('name')) {
                // left and right columns directly impacted
                view.resizingColumnLeft = $(columns[i-1]);
                view.resizingColumnRight = $(element);

                return false;
            }
        });

        if (this.resizingColumnLeft && this.resizingColumnRight) {
            $('body').addClass('unselectable');

            // initial mouse position
            this.resizingColumnStartOffset = e.screenX;

            // initial widths
            this.resizingColumnLeftStartWidth = this.resizingColumnLeft.width();
            this.resizingColumnRightStartWidth = this.resizingColumnRight.width();
        }
    },

    onResizeColumnFinish: function(e) {
        if (this.resizingColumnLeft && this.resizingColumnRight) {
            $('body').removeClass('unselectable');

            this.resizingColumnLeft = null;
            this.resizingColumnRight = null;
        }
    },

    onResizeColumnMove: function (e) {
        if (this.resizingColumnLeft) {
            var delta = e.screenX - this.resizingColumnStartOffset;

            // new width respecting the min width
            var leftWidth = Math.max(
                this.resizingColumnLeft.css('min-width').replace('px', ''),
                this.resizingColumnLeftStartWidth + delta);

            var rightWidth = Math.max(
                this.resizingColumnRight.css('min-width').replace('px', ''),
                this.resizingColumnRightStartWidth - delta);

            this.resizingColumnLeft.width(leftWidth);
            this.resizingColumnRight.width(rightWidth);

            // adjust width of every columns
            var columns = this.ui.thead.children('tr').children('th');
            $.each(columns, function(i, element) {
                var el = $(element);
                el.width(el.width());

                // and especially of the title div (minus border left width)
                el.children('div').not('div.column-sizer').width(el.width()-1)
            });
        }
    },

    capacity: function() {
        var scrollElement = this.getScrollElement();
        return Math.max(1, Math.floor(scrollElement.prop('clientHeight') / this.rowHeight));
    },

    moreResults: function(more, scroll) {
        scroll || (scroll=false);
        more || (more=20);

        var view = this;

        if (more === -1) {
            more = this.capacity() + 1;
        }

        if ((this.collection !== null) && (this.collection.next !== null)) {
            this.collection.fetch({update: true, remove: false, data: {
                cursor: this.collection.next,
                sort_by: this.collection.sort_by,
                more: more
            }}).done(function(data) {
                var scrollElement = view.getScrollElement();

                // re-sync the sticky table header during scrolling after collection was rendered
                // if (!view.ui.table.hasClass('table-advanced')) {
                //     $(view.ui.table).stickyTableHeaders({scrollableArea: scrollElement});
                // }

                if (scroll) {
                    // var height = scrollElement.prop('scrollHeight');
                    var clientHeight = scrollElement.prop('clientHeight');
                    // scrollElement.scrollTop(height - clientHeight - view.rowHeight * 0.5);

                    // view page scrolling
                    scrollElement.scrollTop(scrollElement.scrollTop() + view.capacity() * view.rowHeight);
                }
            });
        } else if (scroll) {
            var scrollElement = view.getScrollElement();
            var clientHeight = scrollElement.prop('clientHeight');

            // view page scrolling
            scrollElement.scrollTop(scrollElement.scrollTop() + view.capacity() * view.rowHeight);
        }
    },

    onRefreshChildren: function () {
        this.updateColumnsWidth();
    },

    onRenderCollection: function() {
        // post refresh on children once every children was rendered for the first rendering
        if (this.lastModels == undefined) {
            this.onRefreshChildren();
        }
    },

    onCollectionSync: function (collection, data) {
        // keep list of last queried models, done just once the collection get synced
        this.lastModels = [];

        if (data && data.items && data.items.length > 0) {
            for (var i = 0; i < data.items.length; ++i) {
                this.lastModels.push(this.collection.get(data.items[i].id));
            }

            // post refresh on children once every children was rendered for any other rendering
            this.onRefreshChildren();
        }
    },

    scroll: function(e) {
        if (!this.ui.table.hasClass('table-advanced')) {
            if (this.getScrollElement().scrollTop() > 1) {
                this.ui.thead.addClass("sticky");
            } else{
                this.ui.thead.removeClass("sticky");
            }
        }

        if (e.target.scrollHeight-e.target.clientHeight === e.target.scrollTop) {
            this.moreResults();
        }
    },

    getLastModels: function() {
        if (this.lastModels == undefined) {
            this.lastModels = [];
            for (var i = 0; i < this.collection.models.length; ++i) {
                this.lastModels.push(this.collection.models[i]);
            }
        }

        return this.lastModels;
    },

    onAddColumnAction: function(e) {
        var contextMenu = this.ui.add_column_menu;
        if (contextMenu.length) {

            if (contextMenu.css('display') === 'block') {
                contextMenu.hide();
            } else {
                // clear previous values
                var ul = contextMenu.children('ul.dropdown-menu').html("");
                var displayedColumns = new Set();

                // add displayed columns first in order
                for (var i = 0 ; i < this.displayedColumns.length; ++i) {
                    var column = this.displayedColumns[i];

                    var li = $('<li></li>');
                    var a = $('<a tabindex="-1" href="#" name="' + column.name + '"></a>');
                    li.append(a);

                    a.append($('<span class="glyphicon glyphicon-check"></span>'));
                    a.prop("displayed", true);

                    a.append('&nbsp;' + column.label);
                    ul.append(li);

                    displayedColumns.add(column.name);
                }

                // append others columns by alpha order
                var columns = this.getOption('columns') || {};
                var columnsByLabel = []

                for (var columnName in columns) {
                    var column = columns[columnName];
                    columnsByLabel.push({
                        name: columnName,
                        label: column.label,
                        query: column.query || false
                    });
                }

                columnsByLabel.sort(function(a, b) {
                    return a.label.localeCompare(b.label);
                });

                for (var c in columnsByLabel) {
                    var column = columnsByLabel[c];

                    if (!displayedColumns.has(column.name)) {
                        var li = $('<li></li>');
                        var a = $('<a tabindex="-1" href="#" name="' + column.name + '"></a>');
                        li.append(a);

                        a.append($('<span class="glyphicon glyphicon-unchecked"></span>'));
                        a.prop("displayed", false);

                        a.append('&nbsp;' + column.label);
                        ul.append(li);
                    }
                }

                contextMenu.css({
                    display: "block",
                    left: this.ui.add_column.parent().position().left - contextMenu.width(),
                    top: this.ui.add_column.parent().position().top + this.ui.add_column.height(),
                    'z-index': 4  /* upside stickyHeader */
                });
            }

            // event on choices
            this.ui.add_column_menu.find('ul li a').on('click', $.proxy(this.onAddRemoveColumn, this));
        }
    },

    onAddRemoveColumn: function (e) {
        var a = $(e.currentTarget);
        var columnName = a.attr('name');

        if (a.prop("displayed")) {
            var columnId = -1;

            for (var i = 0; i < this.displayedColumns.length; ++i) {
                var column = this.displayedColumns[i];
                if (column.name === columnName) {
                    columnId = i;
                    break;
                }
            }

            if (columnId !== -1) {
                this.displayedColumns.splice(i, 1);

                var headerCol = this.ui.thead.children('tr').children('th[name="' + columnName + '"]');
                headerCol.remove();

                var bodyCol = this.ui.tbody.find('tr td[name="' + columnName + '"]');
                bodyCol.remove();

                this.updateColumnsWidth();

                // update user setting
                if (this.userSettingName) {
                    for (var i = 0; i < this.selectedColumns.length; ++i) {
                        if (this.selectedColumns[i].name === columnName) {
                            this.selectedColumns.splice(i, 1);
                            break;
                        }
                    }

                    application.updateUserSetting(this.userSettingName, this.selectedColumns);
                }
            }
        } else {
            var query = this.getOption('columns')[columnName].query || false;

            this.displayedColumns.push({
                name: columnName,
                label: this.getOption('columns')[columnName].label,
                query: query,
                format: this.getOption('columns')[columnName].format
            });

            // insert the new column dynamically
            var th = $('<th></th>');
            th.attr('name', columnName);
            th.addClass('unselectable');

            var div = $('<div></div>');
            div.append($('<span draggable="true">' + this.getOption('columns')[columnName].label + '</span>'));
            div.prepend($('<span class="glyphicon glyphicon-sort action column-action"></span>'));

            th.append(div);

            this.ui.thead.children('tr').append(th);

            var collection = this.collection;
            var rows = this.ui.tbody.children('tr');
            $.each(rows, function (i, element) {
                var el = $(element);
                var item = collection.get(el.attr('element-id'));
                var column = $('<td></td>');
                column.attr('name', columnName);
                column.attr('descriptor-id', "");

                if (!query) {
                    column.html(item.get('descriptors')[columnName]);
                }

                el.append(column);
            });

            // refresh only the new column on every row
            this.onRefreshChildren(true, this.displayedColumns[this.displayedColumns-1]);

            // update user setting
            if (this.userSettingName) {
                this.selectedColumns.push({
                    name: columnName,
                    width: 'auto',
                    sort_by: null
                });

                application.updateUserSetting(this.userSettingName, this.selectedColumns);
            }
        }
    }
});

module.exports = View;
