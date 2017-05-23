/**
 * @file scroll.js
 * @brief Base view for scrollable view with a cursor collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.CompositeView.extend({
    rowHeight: 1+8+20+8,
    scrollViewInitialized: false,
    userSettingName: null,
    scrollbarWidth: $.position.scrollbarWidth(),

    attributes: {
    },

    ui: {
        table: 'table.table.table-advanced',
        thead: 'table.table.table-advanced thead',
        tbody: 'table.table.table-advanced tbody',
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

        // empty, mean generated at dom refresh
        if (this.getUserSettingName()) {
            this.selectedColumns = application.getUserSetting(this.getUserSettingName()) || this.defaultColumns || [];
        } else {
            this.selectedColumns = this.defaultColumns || [];
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
                    format: options.columns[columnName].format,
                    width: this.selectedColumns[i].width
                });
            }
        }

        this.initialResizeDone = false;
    },

    getUserSettingName: function() {
        if (this.userSettingName != undefined) {
            if (_.isFunction(this.userSettingName)) {
                return this.userSettingName();
            } else {
                return this.userSettingName;
            }
        } else {
            return null;
        }
    },

    getScrollElement: function() {
        var scrollElement = this.$el.parent();

        if (this.ui.tbody.parent().parent().css('overflow-y') === "auto") {
            scrollElement = this.ui.tbody.parent().parent();
        }

        return scrollElement;
    },

    isDisplayed: function() {
        if (this.ui.table instanceof Object) {
            return this.ui.table.offsetParent().length && this.ui.table.offsetParent()[0].nodeName !== 'HTML';
        } else {
            return false;
        }
    },

    onResetCollection: function() {
        this.lastModels = null;

        // reset scrolling
        var scrollElement = this.getScrollElement();
        scrollElement.scrollTop(0);

        // this.initialResizeDone = false;
    },

    onDomRefresh: function() {
        // we can only init here because we need to known the parent container
        if (!this.scrollViewInitialized) {
            // pagination on scrolling using the direct parent as scroll container
            var scrollElement = this.getScrollElement();

            scrollElement.scroll($.proxy(this.scroll, this));

            // column resizing
            $("body").on('mousemove', $.proxy(this.onResizeColumnMove, this));
            $("body").on('mouseup', $.proxy(this.onResizeColumnFinish, this));
            $(window).on('resize', $.proxy(this.onResizeWindow, this));

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

            // create an entry per column from template
            if (this.selectedColumns.length === 0) {
                var headerRows = this.ui.thead.children('tr').children('td,th');
                var view = this;

                $.each(headerRows, function (i, element) {
                    var name = $(element).attr('name');
                    if (name == undefined || name === "") {
                        name = "unamed" + i;
                        $(element).attr('name', name);
                    }

                    view.selectedColumns.push({
                        name: name,
                        width: "auto",
                        sort_by: null
                    })
                });
            }

            this.updateColumnsWidth(true);
            this.scrollViewInitialized = true;
        }

        // if displayed adjust columns width
        if (this.isDisplayed()) {
            this.updateColumnsWidth();
        }
    },

    onResizeWindow: function() {
        if (this.isDisplayed()) {
            this.updateColumnsWidth(true);
        }
    },

    onShowTab: function(tabView) {
        if (this.isDisplayed()) {
            this.updateColumnsWidth();
        }
    },

    updateColumnsWidth: function(autoAdjust) {
        if (!this.ui.table.hasClass('table-advanced') || !this.ui.table.hasClass('table-advanced')) {
            return;
        }

        // not displayed at this time, wait for a visibility signal (onShowTab or onDomRefresh)
        if (!this.isDisplayed()) {
            return;
        }

        // should be done after the columns content update (refresh)
        var columnsWidth = [];
        var firstBodyRow = this.ui.tbody.children('tr:first-child');
        var zero = false;
        var view = this;

        autoAdjust != undefined || (autoAdjust = false);

        var headerRows = this.ui.thead.children('tr').children('th,td');
        var rows = firstBodyRow.children('th,td');

        // when overflow-y on body, pad the right of the head
        if (this.ui.tbody.parent().parent()[0].clientHeight < this.ui.tbody.parent().parent()[0].scrollHeight) {
            this.ui.thead.parent().parent().css('padding-right', this.scrollbarWidth + 'px');
        } else {
            this.ui.thead.parent().parent().css('padding-right', '');
        }

        this.ui.thead.parent().width(this.ui.tbody.parent().width());

        // no content
        if (rows.length === 0) {
            if (!this.initialResizeDone) {
                $.each(headerRows, function (i, element) {
                    var width = i < view.selectedColumns.length ? view.selectedColumns[i].width : null;

                    // width is defined by the configuration or is computed
                    if (width != undefined && width != "auto") {
                        // size from user settings
                        columnsWidth.push(width);
                    } else {
                        // size from body
                        width = $(element).width();
                        columnsWidth.push(width);
                    }

                    zero = width <= 0;
                });
            } else {
                $.each(headerRows, function (i, element) {
                    var width = i < view.selectedColumns.length ? view.selectedColumns[i].width : null;
                    if (width != undefined && width != "auto") {
                        columnsWidth.push(width);
                    } else {
                        columnsWidth.push("auto");
                    }
                });
            }
        }

        //
        // initialize uninitialized columns
        //

        var fixedPrevColumn = false;

        $.each(headerRows, function (i, element) {
            var el = $(element);
            var label = el.children('div.table-advanced-label');

            // if not exist insert the label into a sub-div
            if (label.length === 0) {
                label = $('<div class="table-advanced-label"></div>').html(el.html()).attr('title', el.text());
                el.html(label);

                var draggable = label.children('[draggable]');
                draggable.on('dragstart', $.proxy(view.onColumnDragStart, view));
                draggable.on('dragend', $.proxy(view.onColumnDragEnd, view));
                draggable.on('dragenter', $.proxy(view.onColumnDragEnter, view));
                draggable.on('dragleave', $.proxy(view.onColumnDragLeave, view));
                draggable.on('dragover', $.proxy(view.onColumnDragOver, view));
                draggable.on('drop', $.proxy(view.onColumnDrop, view));
            }

            // try to keep as possible the title entirely visible
            if (el.hasClass('title-column') && label.css('min-width') === '0px') {
                // pre-compute
                label.width('auto');
                var minWidth = label.width();
                // label.css('min-width', minWidth + 8 + 8 + 'px');

                // +4+1 padding right + border left
                el.css('min-width', minWidth + 8 + 8 + (i === 0 ? 0 : 1) + 'px');

                // and for the first body row
                $(rows.get(i)).css('min-width', minWidth + 8 + 8 + (i === 0 ? 0 : 1) + 'px');
                
                el.width('auto');
            } else if (el.hasClass('glyph-fixed-column')) {
                el.css('min-width', label.width());
                el.css('max-width', label.width());
            } else if (label.css('min-width') === '0px') {
                // for each sorter, plus 3 par span, plus 3 of right margin
                var sorters = label.children('span.column-action').length * (label.children('span.column-action').width() + 3 + 3);

                var minWidth = 32 + sorters;
                // label.css('min-width', minWidth + 'px');
                el.css('min-width', minWidth + 8 + 8 + (i === 0 ? 0 : 1) + 'px');
                $(rows.get(i)).css('min-width', minWidth + 8 + 8 + (i === 0 ? 0 : 1) + 'px');

                el.width('auto');
            }

            // name unamed columns
            if (el.attr('name') === undefined || el.attr('name') === "") {
                el.attr('name', 'unamed' + i);
            }

            // add column sizer for each column except the first and the last
            if (i > 0 && i < headerRows.length && el.children('div.column-sizer').length === 0) {
                var sizer = $('<div class="column-sizer"></div>');
                el.prepend(sizer);

                sizer.append('<div></div>');

                // active sizer only if the left column is not fixed size
                if (!fixedPrevColumn) {
                    sizer.addClass('active');

                    sizer.on('mousedown', $.proxy(view.onResizeColumnBegin, view));
                    sizer.on('mouseover', $.proxy(view.onResizeColumnHover, view));
                }
            }

            // fixed column, then no sizer on the left of the next column
            fixedPrevColumn = !!el.hasClass('glyph-fixed-column');
        });

        // auto adjust, recompute the correct with for each column and keep it in local configuration
        if (autoAdjust) {
            $.each(headerRows, function(i, element) {
                var el = $(element);
                // var label = el.children('div.table-advanced-label');

                if (!el.hasClass('glyph-fixed-column')) {
                    el.width(el.width());
                    $(rows[i]).width(el.width());

                    // and especially of the title div (minus border left width) (@see computeClipping)
                    // label.width(el.width() - (i === 0 ? 0 : 1));

                    // update user setting locally (minus border left except on first column)
                    view.selectedColumns[i].width = el.width();
                } else {
                    view.selectedColumns[i].width = "auto";
                }
            });
        } else {
            // or setup the width from the local configuration
            $.each(rows, function (i, element) {
                var width = i < view.selectedColumns.length ? view.selectedColumns[i].width : null;

                // width is defined by the configuration or is computed
                if (width != undefined && width != "auto") {
                    // size from user settings
                    columnsWidth.push(width);
                } else {
                    // size from body
                    width = $(element).width();
                    columnsWidth.push(width);
                }

                zero = width <= 0;
            });

            // case of 0 width columns, columns are not ready, try again later
            if (zero) {
                return;
            }

            $.each(headerRows, function (i, element) {
                var el = $(element);
                var label = el.children('div.table-advanced-label');

                // resize header column except glyph fixed columns
                if (label.length && !el.hasClass('glyph-fixed-column')) {
                    // count border left (no left border for the first column)
                    $(rows[i]).width(columnsWidth[i]);
                    el.width(columnsWidth[i]);

                    // (@see computeClipping)
                    // label.width(columnsWidth[i] - (i === 0 ? 0 : 1));

                    // update user setting locally (minus border left except on first column)
                    view.selectedColumns[i].width = el.width();
                } else {
                    view.selectedColumns[i].width = "auto";
                }
            });
        }

        this.computeClipping();

        // done
        if (!this.initialResizeDone) {
            this.initialResizeDone = true;
        }
    },

    onResize: function() {
        // re-adjust when parent send a resize event
        if (this.initialResizeDone) {
            if (this.isDisplayed()) {
                this.updateColumnsWidth(true);
                this.computeClipping();
            }
        }
    },

    onColumnDragStart: function(e) {
        var target = $(e.currentTarget);

        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

        target.parent().css('opacity', '0.4');

        var i1;
        $.each(this.ui.thead.children('tr').children('td,th'), function(i, element) {
            if (target.parent().parent().attr('name') === $(element).attr('name')) {
                i1 = i;
                return false;
            }
        });

        // opacity of each cell
        $.each(this.ui.tbody.children('tr'), function(i, element) {
            $(element).children('th,td').eq(i1).css('opacity', '0.4');
        });

        application.dndElement = target;
    },

    onColumnDragEnd: function(e) {
        var target = $(e.currentTarget);

        target.parent().css('opacity', 'initial');

        var i1;
        $.each(this.ui.thead.children('tr').children('td,th'), function(i, element) {
            if (target.parent().parent().attr('name') === $(element).attr('name')) {
                i1 = i;
                return false;
            }
        });

        // opacity of each cell
        $.each(this.ui.tbody.children('tr'), function(i, element) {
            $(element).children('th,td').eq(i1).css('opacity', 'initial');
        });

        application.dndElement = null;
    },

    onColumnDragEnter: function(e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (e.currentTarget === application.dndElement[0]) {
            return false;
        }

        var target = $(e.currentTarget);

        target.parent().css('opacity', '0.4');

        var i2;
        $.each(this.ui.thead.children('tr').children('td,th'), function(i, element) {
            if (target.parent().parent().attr('name') === $(element).attr('name')) {
                i2 = i;
                return false;
            }
        });

        // opacity of each cell
        $.each(this.ui.tbody.children('tr'), function(i, element) {
            $(element).children('th,td').eq(i2).css('opacity', '0.4');
        });

        return false;
    },

    onColumnDragLeave: function(e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (e.currentTarget === application.dndElement[0]) {
            return false;
        }

        var target = $(e.currentTarget);

        target.parent().css('opacity', 'initial');

        var i2;
        $.each(this.ui.thead.children('tr').children('td,th'), function(i, element) {
            if (target.parent().parent().attr('name') === $(element).attr('name')) {
                i2 = i;
                return false;
            }
        });

        // opacity of each cell
        $.each(this.ui.tbody.children('tr'), function(i, element) {
            $(element).children('th,td').eq(i2).css('opacity', 'initial');
        });

        return false;
    },

    onColumnDragOver: function(e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        return false;
    },

    onColumnDrop: function(e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation();
        }

        var target = $(e.currentTarget);

        target.parent().css('opacity', 'initial');

        var srcName = application.dndElement.parent().parent().attr('name');
        var dstName = target.parent().parent().attr('name');

        if (srcName !== dstName) {
            // switch the two columns
            var i1 = 0, i2 = 0;
            $.each(this.ui.thead.children('tr').children('td,th'), function(i, element) {
                if ($(element).attr('name') === dstName) {
                    i1 = i;
                } else if ($(element).attr('name') === srcName) {
                    i2 = i;
                }
            });

            // switch label
            target.parent().parent().swapWith(application.dndElement.parent().parent());

            // switch for any row and reset opacity
            $.each(this.ui.tbody.children('tr'), function(i, element) {
                var columns = $(element).children('th,td');
                columns.eq(i1).swapWith(columns.eq(i2)).css('opacity', 'initial');
            });

            // switch selectedColumns
            var tmp = this.selectedColumns[i1];
            this.selectedColumns[i1] = this.selectedColumns[i2];
            this.selectedColumns[i2] = tmp;

            // switch displayedColumns
            var col1 = null, col2 = null;
            for (var i = 0; i < this.displayedColumns.length; ++i) {
                if (this.displayedColumns[i].name === this.selectedColumns[i1].name) {
                    col1 = i;
                } else if (this.displayedColumns[i].name === this.selectedColumns[i2].name) {
                    col2 = i;
                }
            }

            tmp = this.displayedColumns[col1];
            this.displayedColumns[col1] = this.displayedColumns[col2];
            this.displayedColumns[col2] = tmp;

            // re-adjust columns for some cases
            this.updateColumnsWidth(true);

            // save user settings
            if (this.getUserSettingName()) {
                application.updateUserSetting(this.getUserSettingName(), this.selectedColumns);
            }
        }

        return false;
    },

    onResizeColumnHover: function(e) {
        var sizer = $(e.currentTarget);

        // get the previous column
        var column = sizer.parent();
        var columns = column.parent().find('th');

        // adapt the cursor, because if the right column is fixed size, the resize cannot be performed
        $.each(columns, function(i, element) {
            var el = $(element);

            if (el.attr('name') === column.attr('name')) {
                if (el.hasClass('glyph-fixed-column')) {
                    el.children('div.column-sizer').css('cursor', 'default');
                } else {
                    el.children('div.column-sizer').css('cursor', '');
                }

                return false;
            }
        });
    },

    onResizeColumnBegin: function (e) {
        var sizer = $(e.currentTarget);

        // get the previous column
        var column = sizer.parent();
        var columns = column.parent().find('th');
        var view = this;

        this.resizingColumnLeft = null;

        $.each(columns, function(i, element) {
            if ($(element).attr('name') === column.attr('name')) {
                // left and right columns directly impacted
                view.resizingColumnLeft = $(columns[i-1]);
                view.resizingColumnRight = $(element);
                view.resizingColumnIndex = i;

                return false;
            }
        });

        // cancel if right is fixed
        if (this.resizingColumnRight.hasClass('glyph-fixed-column')) {
            this.resizingColumnLeft = null;
            this.resizingColumnRight = null;
            this.resizingColumnIndex = null;

            return false;
        }

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

            var view = this;

            var headerRows = this.ui.thead.children('tr').children('td,th');
            $.each(headerRows, function (i, element) {
                var el = $(element);

                // ignored fixed columns width
                if (!el.hasClass('glyph-fixed-column')) {
                    view.selectedColumns[i].width = el.width();
                } else {
                    view.selectedColumns[i].width = "auto";
                }
            });

            // save user settings
            if (this.getUserSettingName()) {
                application.updateUserSetting(this.getUserSettingName(), this.selectedColumns);
            }

            this.resizingColumnLeft = null;
            this.resizingColumnRight = null;
        }
    },

    onResizeColumnMove: function (e) {
        if (this.resizingColumnLeft && this.resizingColumnRight) {
            var delta = e.screenX - this.resizingColumnStartOffset;

            // new width respecting the min width
            var leftWidth = Math.max(
                parseInt(this.resizingColumnLeft.css('min-width').replace('px', '')),
                this.resizingColumnLeftStartWidth + delta);

            var rightWidth = Math.max(
                parseInt(this.resizingColumnRight.css('min-width').replace('px', '')),
                this.resizingColumnRightStartWidth - delta);

            this.resizingColumnLeft.width(leftWidth);
            this.resizingColumnRight.width(rightWidth);

            // define width of header
            var head = this.ui.thead.children('tr').children('th,td');
            var body = this.ui.tbody.children('tr:first-child').children('th,td');

            // and body
            $(body[this.resizingColumnIndex-1]).width(leftWidth);
            $(body[this.resizingColumnIndex]).width(rightWidth);

            // and auto-adjust all columns from body constraints
            $.each(body, function(i, element) {
                var el = $(element);
                var headEl = $(head[i]);
                var div = headEl.children('div.table-advanced-label');

                if (!el.hasClass('glyph-fixed-column')) {
                    headEl.width(el.width());

                    // adjust the label div (minus border left width)
                    div.width(el.width() - (i === 0 ? 0 : 1));
                }
            });

            this.computeClipping();
        }
    },

    capacity: function() {
        var scrollElement = this.getScrollElement();
        return Math.max(1, Math.floor(scrollElement.prop('clientHeight') / this.rowHeight));
    },

    isNeedMoreResults: function() {
        var scrollElement = this.getScrollElement();
        var clientHeight = scrollElement.prop('clientHeight');
        var diff = scrollElement.prop('scrollHeight') - scrollElement.scrollTop() - clientHeight;

        // less than one page in buffer (minus margin height)
        return diff - (scrollElement.outerHeight(true) - scrollElement.height()) <= clientHeight;
    },

    scrollOnePage: function(direction) {
        direction !== undefined || (direction = 1);

        var scrollElement = this.getScrollElement();
        var clientHeight = scrollElement.prop('clientHeight');
        var amount = this.capacity() * this.rowHeight;

        // view page scrolling
        scrollElement.scrollTop(scrollElement.scrollTop() + amount * (direction > 0 ? 1 : -1));
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
                // var scrollElement = view.getScrollElement();

                if (scroll) {
                    view.scrollOnePage(1);

                    // // var height = scrollElement.prop('scrollHeight');
                    // var clientHeight = scrollElement.prop('clientHeight');
                    // // scrollElement.scrollTop(height - clientHeight - view.rowHeight * 0.5);
                    //
                    // // view page scrolling
                    // scrollElement.scrollTop(scrollElement.scrollTop() + view.capacity() * view.rowHeight);
                }
            });
        } else if (scroll) {
            this.scrollOnePage(1);
        }
    },

    onRefreshChildren: function () {
        var view = this;

        return $.when.apply($, []).done(function () {
            view.updateColumnsWidth();
        });
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
        } else {
            this.updateColumnsWidth();
        }
    },

    scroll: function(e) {
        if (this.previousScrollTop === undefined) {
            this.previousScrollTop = 0;
        }

        if (e.target.scrollTop !== this.previousScrollTop) {
            this.previousScrollTop = e.target.scrollTop;

            if (e.target.scrollHeight - e.target.clientHeight === e.target.scrollTop) {
                this.moreResults();
            }
        }

        if (this.previousScrollLeft === undefined) {
            this.previousScrollLeft = 0;
        }

        if (e.target.scrollLeft !== this.previousScrollLeft) {
            this.computeClipping();
            this.previousScrollLeft = e.target.scrollLeft;
        }
    },

    computeClipping: function() {
        // adjust left of every columns header
        var head = this.ui.thead.children('tr').children('th,td');
        var body = this.ui.tbody.children('tr:first-child').children('th,td');
        var clientWidth = this.$el.innerWidth();

        var hasScroll = (this.el.scrollHeight - this.el.clientHeight) > 0;

        // var scrollLeft = this.ui.tbody.parent().parent().scrollLeft();
        var leftMargin = application.isFirefox ? 7 : 8;
        var rightMargin = this.ui.add_column.length > 0 ? this.ui.add_column.parent().width() : 0;
        var leftClip = this.ui.table.position().left;
        var rightClip = this.ui.add_column.length > 0 ? this.ui.add_column.parent().width() : 0;

        if (hasScroll) {
            rightMargin = Math.max(rightMargin, this.scrollbarWidth);
        }

        $.each(head, function(i, element) {
            var el = $(element);
            var row = $(body.get(i));
            var label = el.children('div.table-advanced-label');
            var sizer = el.children('div.column-sizer');

            var left = row.length > 0 ? row.position().left : el.position().left;
            var w = row.length > 0 ? row.width() : el.width();

            label.css('left', left + leftMargin);
            sizer.css('left', left + leftMargin);

            if (left < leftClip) {
                var l = Math.max(0, leftClip - leftMargin - left);
                var r = w + 2;
                label.css('clip', 'rect(0px ' + r + 'px 32px ' + l + 'px)');
                sizer.css('display', 'none');

                if (r - l <= 0) {
                    label.css('display', 'none');
                } else {
                    label.css('display', '');
                }
            } else if (left+w > clientWidth - rightMargin) {
                var l = 0;
                var r = Math.max(0, clientWidth - left - rightMargin);
                label.css('clip', 'rect(0px ' + r + 'px 32px ' + l + 'px)');

                if (left > clientWidth || r - l <= 0) {
                    label.css('display', 'none');
                    sizer.css('display', 'none');
                } else {
                    label.css('display', '');
                    sizer.css('display', '');

                    // avoid overflow on body that makes a scrollbar
                    if (!el.hasClass('glyph-fixed-column')) {
                        var minWidth = Math.min(w + 2, r - l + 8);
                        label.width(minWidth);
                    }
                }
            } else {
                label.css('clip', '');
                label.css('display', 'block');

                sizer.css('display', 'block');

                // restore
                if (!el.hasClass('glyph-fixed-column')) {
                    label.width(w + 2);
                }
            }
        });
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
                var columnsByLabel = [];

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
                    top: this.ui.add_column.parent().position().top + this.ui.add_column.height()
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

                var bodyCol = this.ui.tbody.children('tr').children('td[name="' + columnName + '"]');
                bodyCol.remove();

                // update user setting
                for (var i = 0; i < this.selectedColumns.length; ++i) {
                    if (this.selectedColumns[i].name === columnName) {
                        this.selectedColumns.splice(i, 1);
                        break;
                    }
                }

                this.updateColumnsWidth(true);

                if (this.getUserSettingName()) {
                    application.updateUserSetting(this.getUserSettingName(), this.selectedColumns);
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
            th.append($('<span draggable="true">' + this.getOption('columns')[columnName].label + '</span>'));

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

            // update user setting
            this.selectedColumns.push({
                name: columnName,
                width: null,
                sort_by: null
            });

            var view = this;

            // refresh only the new column on every row
            this.onRefreshChildren(true, this.displayedColumns[this.displayedColumns-1]).done(function() {
                // save once refresh is done completely
                if (view.getUserSettingName()) {
                    application.updateUserSetting(view.getUserSettingName(), view.selectedColumns);
                }
            });
        }
    }
});

module.exports = View;
