/**
 * @file advancedtable.js
 * @brief Table view customizable cells and headers, resizable, dynamic columns (add, remove, move).
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details Table view customizable cells and headers, resizable, dynamic columns (add, remove, move), with auto
 * fetching on collection using infinite scrolling. Also support sorting and multi-columns sorting.
 */

let Marionette = require('backbone.marionette');

const EXPONENT_MAP = {
    0: '¹',
    1: '²',
    2: '³',
    3: '⁴',
    4: '⁵',
    5: '⁶',
    6: '⁷',
    7: '⁸',
    8: '⁹'
};
/*
let TableBody = Marionette.CollectionView.extend({
    tagName: 'tbody',
    childView: RowView
});
*/

// @todo evolve to CollectionView and a layout before Mn remove CompositeView
let View = Marionette.CompositeView.extend({
    rowHeight: 1 + 8 + 20 + 8,
    scrollViewInitialized: false,
    userSettingName: null,
    userSettingVersion: null,
    scrollbarWidth: $.position.scrollbarWidth(),

    className: 'advanced-table-container',
    childViewContainer: 'tbody.entity-list',

    attributes: {},

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
        'click @ui.thead': 'onClickHead',
        'click @ui.tbody': 'onClickBody',
        'click @ui.add_column': 'onAddColumnAction',
        'click @ui.add_column_column': 'onAddColumn'
    },

    behaviors: function() {
        return {
            ActionBtnEvents: {
                behaviorClass: require('../../main/behaviors/cellcontextmenu'),
                collection: this.getOption('collection'),
                table: this
            }
        };
    },

    templateContext: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    childViewOptions: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    constructor: function () {
        let prototype = this.constructor.prototype;

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

        if (options.columns === undefined) {
            options.columns = {};
        } else {
            // detach
            options.columns = _.deepClone(options.columns);
        }

        // merge values for each column
        if (this.columnsOptions !== undefined) {
            for (let columnName in this.columnsOptions) {
                if (columnName in options.columns) {
                    _.extend(options.columns[columnName], _.deepClone(this.columnsOptions[columnName]));
                } else {
                    options.columns[columnName] = _.deepClone(this.columnsOptions[columnName]);
                }
            }
        }

        this.listenTo(this.collection, 'reset', this.onResetCollection, this);
        this.listenTo(this.collection, 'sync', this.onCollectionSync, this);

        // empty, mean generated at dom refresh
        if (this.getUserSettingName()) {
            this.selectedColumns = window.application.getUserSetting(
                this.getUserSettingName(),
                this.getUserSettingVersion(),
                this.defaultColumns || []);

            // last element position used after sync collection
            if (history.state) {
                this.initialScrollTop = history.state.scrollPos ? history.state.scrollPos : null;
                this.initialMore = history.state.numElt ? history.state.numElt : null;
            }
        } else {
            this.selectedColumns = this.defaultColumns || [];
            this.initialScrollTop = null;
            this.initialMore = null;
        }

        // process columns
        this.displayedColumns = [];

        // setup dynamic columns list
        for (let i = 0; i < this.selectedColumns.length; ++i) {
            let columnName = this.selectedColumns[i].name;
            let column = options.columns[columnName];

            if (column) {
                this.displayedColumns.push(columnName);
            }
        }

        this.initialResizeDone = false;
    },

    getUserSettingName: function () {
        if (this.userSettingName) {
            if (_.isFunction(this.userSettingName)) {
                return this.userSettingName();
            } else {
                return this.userSettingName;
            }
        } else {
            return null;
        }
    },

    getUserSettingVersion: function () {
        if (this.userSettingVersion) {
            if (_.isFunction(this.userSettingVersion)) {
                return this.userSettingVersion();
            } else {
                return this.userSettingVersion;
            }
        } else {
            return null;
        }
    },

    getScrollElement: function () {
        let scrollElement = this.$el.parent();

        if (this.ui.tbody.parent().parent().css('overflow-y') === "auto") {
            scrollElement = this.ui.tbody.parent().parent();
        }

        return scrollElement;
    },

    isDisplayed: function () {
        if (this.ui.table instanceof Object) {
            return this.ui.table.offsetParent().length && this.ui.table.offsetParent()[0].nodeName !== 'HTML';
        } else {
            return false;
        }
    },

    /**
     * Reset the collection and process the first fetch according to the current columns settings.
     * This method must be called in place of the collection fetch else the initial sort cannot be performed
     * by the user settings took by the view.
     */
    query: function () {
        if (this.collection) {
            // cleanup
            let headers = this.ui.thead.children('tr').children('th,td').find('div.table-advanced-label');
            headers.children('span.column-sorter').removeClass(
                'sortby-asc-column sortby-desc-column fa-sort-asc fa-sort-desc')
                .attr('sort-position', null)
                .empty();

            let sort_by = [];
            let numOrders = 0;

            for (let i = 0; i < this.selectedColumns.length; ++i) {
                let selectColumn = this.selectedColumns[i];

                if (selectColumn.sort_by) {
                    ++numOrders;
                }
            }

            for (let i = 0; i < this.selectedColumns.length; ++i) {
                let selectColumn = this.selectedColumns[i];
                if (!selectColumn.sort_by) {
                    continue;
                }

                let sort_by_match = selectColumn.sort_by.match(/^([\+\-]*)([0-9]+)$/);
                if (!sort_by_match) {
                    continue;
                }

                let order = sort_by_match[1] ? sort_by_match[1] : '+';
                let pos = sort_by_match[2] ? sort_by_match[2] : 0;
                let sortField = this.getSortField(selectColumn.name);

                sort_by.splice(pos, 0, order + sortField);

                // setup column header
                let el = this.ui.thead.children('tr').children('th,td').eq(i);
                let sorter = el.children('div.table-advanced-label').children('span.column-sorter');
                sorter.attr('sort-position', pos);

                if (numOrders > 1) {
                    sorter.text(EXPONENT_MAP[pos] || '');
                } else {
                    sorter.text('');
                }

                if (order === '+') {
                    sorter.addClass('sortby-asc-column fa-sort-asc');
                } else if (order === '-') {
                    sorter.addClass('sortby-desc-column fa-sort-desc');
                } else {
                    sorter.addClass('fa-sort');
                }
            }

            // for simplified columns view, specify a default sort by
            if (sort_by.length === 0 && this.defaultSortBy) {
                sort_by = this.defaultSortBy;
            }

            this.collection.fetch({
                reset: true, data: {
                    sort_by: sort_by
                }
            });
        }
    },

    onResetCollection: function () {
        this.lastModels = null;

        // reset scrolling
        let scrollElement = this.getScrollElement();
        scrollElement.scrollTop(0);

        // this.initialResizeDone = false;
    },

    onDestroy: function () {
        // cleanup bound events
        $("body").off('mousemove', $.proxy(this.onResizeColumnMove, this))
            .off('mouseup', $.proxy(this.onResizeColumnFinish, this));

        $(window).off('focusout', $.proxy(this.onWindowLostFocus, this))
            .off('keydown', $.proxy(this.onKeyDown, this))
            .off('keyup', $.proxy(this.onKeyUp, this));
    },

    onDomRefresh: function () {
        // we can only init here because we need to known the parent container
        if (!this.scrollViewInitialized) {
            let self = this;

            // pagination on scrolling using the direct parent as scroll container
            let scrollElement = this.getScrollElement();
            scrollElement.on('scroll', $.proxy(this.scroll, this));

            // column resizing
            $("body").on('mousemove', $.proxy(this.onResizeColumnMove, this))
                .on('mouseup', $.proxy(this.onResizeColumnFinish, this));

            // order by using CTRL key
            $(window).on('focusout', $.proxy(this.onWindowLostFocus, this))
                .on('keydown', $.proxy(this.onKeyDown, this))
                .on('keyup', $.proxy(this.onKeyUp, this));

            // btn events
            this.ui.add_column_menu.children('div.btn-group').children('span.select-all').on('click', function () {
                self.ui.add_column_menu.children('ul.columns-list')
                    .children('li.column').children('label').children('input').prop("checked", true);
            });

            this.ui.add_column_menu.children('div.btn-group').children('span.select-none').on('click', function () {
                self.ui.add_column_menu.children('ul.columns-list')
                    .children('li.column').children('label').children('input').prop("checked", false);
            });

            this.ui.add_column_menu.children('div.btn-group').children('span.select-cancel').on('click', function () {
                // destroy the glass pane
                window.application.main.glassPane('destroy');
                self.ui.add_column_menu.hide(false);
            });

            this.ui.add_column_menu.children('div.btn-group').children('span.select-accept').on(
                'click', $.proxy(this.onAddRemoveColumn, this));

            this.ui.add_column_menu.children('div.input-group').children('input[name=add-column-filter]').on('input', function (e) {
                let name = $(e.target).val();
                let labels = self.ui.add_column_menu.children('ul.columns-list')
                    .children('li.column')
                    .children('label');

                $.each(labels, function (i, element) {
                    let el = $(element);

                    let c1 = el.attr('name').toUpperCase().indexOf(name.toUpperCase()) !== -1;
                    let c2 = el.text().toUpperCase().indexOf(name.toUpperCase()) !== -1;

                    if (c1 || c2) {
                        el.parent().css('display', 'block');
                    } else {
                        el.parent().css('display', 'none');
                    }
                });
            });

            // create an entry per column from template
            if (this.selectedColumns.length === 0) {
                let headerRows = this.ui.thead.children('tr').children('td,th');

                $.each(headerRows, function (i, element) {
                    let name = $(element).attr('name');
                    if (!name) {
                        name = "unamed" + i;
                        $(element).attr('name', name);
                    }

                    self.selectedColumns.push({
                        name: name,
                        width: "auto",
                        sort_by: null
                    })
                });
            }

            this.updateColumnsWidth();
            this.scrollViewInitialized = true;
        }

        // if displayed adjust columns width
        if (this.isDisplayed()) {
            this.updateColumnsWidth();
        }
    },

    onResize: function () {
        // re-adjust when parent send a resize event
        if (this.initialResizeDone) {
            if (this.isDisplayed()) {
                // need async update on some cases of resize
                let view = this;
                setTimeout(function () {
                    view.updateColumnsWidth();

                    // need a second call because width in some case need an adjustment
                    view.computeClipping();
                }, 0);
            }
        }
    },

    onShowTab: function (tabView) {
        if (this.isDisplayed()) {
            console.log("tdidd")
            this.updateColumnsWidth();
        }
        console.log("4545454")
    },

    initHeaders: function () {
        /**
         * Initialize uninitialized columns
         * @type {boolean}
         */
        let view = this;
        let headerRows = this.ui.thead.children('tr').children('th,td');
        let fixedPrevColumn = false;

        $.each(headerRows, function (i, element) {
            let el = $(element);
            let label = el.children('div.table-advanced-label');

            // if not exist insert the label into a sub-div
            if (label.length === 0) {
                label = $('<div class="table-advanced-label"></div>').html(el.html()).attr('title', el.text().trim());
                el.html(label);

                let draggable = label.children('[draggable]');

                draggable.on('dragstart', $.proxy(view.onColumnDragStart, view))
                    .on('dragend', $.proxy(view.onColumnDragEnd, view));

                el.on('dragenter', $.proxy(view.onColumnDragEnter, view))
                    .on('dragleave', $.proxy(view.onColumnDragLeave, view))
                    .on('dragover', $.proxy(view.onColumnDragOver, view))
                    .on('drop', $.proxy(view.onColumnDrop, view));

                let sorters = label.children('span.column-sorter');
                sorters.on('click', $.proxy(view.onSortColumn, view));
            }

            // name unamed columns
            if (el.attr('name') === undefined || el.attr('name') === "") {
                el.attr('name', 'unamed' + i);
            }

            // add column sizer for each column except the first and the last
            if (i > 0 && i < headerRows.length && el.children('div.column-sizer').length === 0) {
                let sizer = $('<div class="column-sizer"></div>');
                el.prepend(sizer);

                sizer.append('<div></div>');

                // active sizer only if the left column is not fixed size
                if (!fixedPrevColumn) {
                    sizer.addClass('active');

                    sizer.on('mousedown', $.proxy(view.onResizeColumnBegin, view))
                        .on('mouseover', $.proxy(view.onResizeColumnHover, view));
                }
            } else if (i === 0 && el.children('div.column-sizer').length !== 0) {
                // remove previous sizer (can appears when moving columns)
                el.children('div.column-sizer').remove();
            }

            // fixed column, then no sizer on the left of the next column
            fixedPrevColumn = !!el.hasClass('glyph-fixed-column');
        });
    },

    updateColumnsWidth: function (autoAdjust) {
        if (!this.ui.table.hasClass('table-advanced') || !this.ui.table.hasClass('table-advanced')) {
            return;
        }

        // not displayed at this time, wait for a visibility signal (onShowTab or onDomRefresh)
        if (!this.isDisplayed()) {
            // at least init headers
            this.initHeaders();
            return;
        }

        // should be done after the columns content update (refresh)
        let columnsWidth = [];
        let firstBodyRow = this.ui.tbody.children('tr:first-child');
        let zero = false;
        let view = this;

        autoAdjust != undefined || (autoAdjust = false);

        let headerRows = this.ui.thead.children('tr').children('th,td');
        let rows = firstBodyRow.children('th,td');

        // when overflow-y on body, pad the right of the head
        let hasScroll = (this.ui.tbody[0].scrollHeight - this.ui.tbody[0].parentNode.parentNode.clientHeight) > 0;
        if (hasScroll || this.ui.add_column.length > 0) {
            this.ui.thead.parent().parent().css('padding-right', this.scrollbarWidth + 'px');
        } else {
            this.ui.thead.parent().parent().css('padding-right', '');
        }

        let tableWidth = this.ui.tbody.width();
        this.ui.thead.parent().width(this.ui.tbody.parent().width());

        // let widthFactor = tableWidth / (this.previousTableWidth || tableWidth);
        // this.previousTableWidth = tableWidth;

        // no content
        if (rows.length === 0) {
            if (!this.initialResizeDone) {
                $.each(headerRows, function (i, element) {
                    let width = i < view.selectedColumns.length ? view.selectedColumns[i].width : null;

                    // width is defined by the configuration or is computed
                    if (width != undefined && width !== "auto") {
                        // size from user settings
                        columnsWidth.push(width * tableWidth);
                    } else {
                        // size from body
                        width = $(element).width();
                        columnsWidth.push(width);
                    }

                    zero = width <= 0;
                });
            } else {
                $.each(headerRows, function (i, element) {
                    let width = i < view.selectedColumns.length ? view.selectedColumns[i].width : null;
                    if (width != undefined && width !== "auto") {
                        columnsWidth.push(width * tableWidth);
                    } else {
                        columnsWidth.push("auto");
                    }
                });
            }
        }

        //
        // initialize uninitialized columns
        //

        let fixedPrevColumn = false;

        $.each(headerRows, function (i, element) {
            let el = $(element);
            let label = el.children('div.table-advanced-label');

            // if not exist insert the label into a sub-div
            if (label.length === 0) {
                label = $('<div class="table-advanced-label"></div>').html(el.html()).attr('title', el.text().trim());
                el.html(label);

                let draggable = label.children('[draggable]');

                draggable.on('dragstart', $.proxy(view.onColumnDragStart, view))
                    .on('dragend', $.proxy(view.onColumnDragEnd, view));

                el.on('dragenter', $.proxy(view.onColumnDragEnter, view))
                    .on('dragleave', $.proxy(view.onColumnDragLeave, view))
                    .on('dragover', $.proxy(view.onColumnDragOver, view))
                    .on('drop', $.proxy(view.onColumnDrop, view));

                let sorters = label.children('span.column-sorter');
                sorters.on('click', $.proxy(view.onSortColumn, view));
            }

            if (el.hasClass('glyph-fixed-column')) {
                el.css('min-width', label.width())
                    .css('max-width', label.width());

            } else if (el.hasClass('title-column') && label.css('min-width') === '0px') {
                // try to keep as possible the title entirely visible

                // pre-compute
                label.width('auto');
                let minWidth = label.width();
                // label.css('min-width', minWidth + 8 + 8 + 'px');

                // +4+1 padding right + border left
                el.css('min-width', minWidth + 8 + 8 + (i === 0 ? 0 : 1) + 'px');

                // and for the first body row
                $(rows.get(i)).css('min-width', minWidth + 8 + 8 + (i === 0 ? 0 : 1) + 'px');

                el.width('auto');
            } else if (label.css('min-width') === '0px') {
                // for each actor + 3 per span + 3 of right margin
                let actors = label.children('span.column-action');
                let actorsWidth = actors.length * (actors.width() + 3 + 3);

                let minWidth = 32 + actorsWidth;
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
                let sizer = $('<div class="column-sizer"></div>');
                el.prepend(sizer);

                sizer.append('<div></div>');

                // active sizer only if the left column is not fixed size
                if (!fixedPrevColumn) {
                    sizer.addClass('active');

                    sizer.on('mousedown', $.proxy(view.onResizeColumnBegin, view))
                        .on('mouseover', $.proxy(view.onResizeColumnHover, view));
                }
            } else if (i === 0 && el.children('div.column-sizer').length !== 0) {
                // remove previous sizer (can appears when moving columns)
                el.children('div.column-sizer').remove();
            }

            // fixed column, then no sizer on the left of the next column
            fixedPrevColumn = !!el.hasClass('glyph-fixed-column');
        });

        // auto adjust, recompute the correct width for each column and keep it in local configuration
        if (autoAdjust) {
            $.each(headerRows, function (i, element) {
                let el = $(element);

                if (!el.hasClass('glyph-fixed-column')) {
                    // adjust head from body
                    $(rows[i]).width($(rows[i]).width());
                    el.width($(rows[i]).width());

                    // update user setting locally (minus border left except on first column)
                    view.selectedColumns[i].width = el.width() / tableWidth;
                } else {
                    view.selectedColumns[i].width = "auto";
                }
            });
        } else {
            // or setup the width from the local configuration
            $.each(rows, function (i, element) {
                let width = i < view.selectedColumns.length ? view.selectedColumns[i].width : null;

                // width is defined by the configuration or is computed
                if (width != undefined && width != "auto") {
                    // size from user settings (normalized)
                    columnsWidth.push(width * tableWidth);
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
                let el = $(element);

                // resize header column except glyph fixed columns
                if (!el.hasClass('glyph-fixed-column')) {
                    // count border left (no left border for the first column)
                    $(rows[i]).width(columnsWidth[i]);
                    el.width(columnsWidth[i]);

                    // update user setting locally (minus border left except on first column)
                    view.selectedColumns[i].width = el.width() / tableWidth;
                } else {
                    view.selectedColumns[i].width = "auto";
                }
            });
        }

        // update labels width, position and clipping
        this.computeClipping();

        // done
        if (!this.initialResizeDone) {
            this.initialResizeDone = true;
        }
    },

    onColumnDragStart: function (e) {
        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

        let target = $(e.currentTarget).parent().parent();
        target.css('opacity', '0.4')
            .children('div.table-advanced-label').addClass('highlight-label');

        let i1;
        $.each(this.ui.thead.children('tr').children('td,th'), function (i, element) {
            if (target.attr('name') === $(element).attr('name')) {
                i1 = i;
                return false;
            }
        });

        // opacity of each cell
        $.each(this.ui.tbody.children('tr'), function (i, element) {
            $(element).children('th,td').eq(i1).css('opacity', '0.4');
        });

        window.application.main.dnd.set(target, 'advanced-table-column');
        this.targetDropElement = null;
    },

    onColumnDragEnd: function (e) {
        let target = $(e.currentTarget).parent().parent();
        target.css('opacity', 'initial')
            .children('div.table-advanced-label').removeClass('highlight-label');

        let i1;
        $.each(this.ui.thead.children('tr').children('td,th'), function (i, element) {
            if (target.attr('name') === $(element).attr('name')) {
                i1 = i;
                return false;
            }
        });

        // opacity of each cell
        $.each(this.ui.tbody.children('tr'), function (i, element) {
            $(element).children('th,td').eq(i1).css('opacity', 'initial');
        });

        if (this.targetDropElement) {
            let target = $(this.targetDropElement);
            target.css('opacity', 'initial')
                .children('div.table-advanced-label').removeClass('highlight-label');

            let i2;
            $.each(this.ui.thead.children('tr').children('td,th'), function (i, element) {
                if (target.attr('name') === $(element).attr('name')) {
                    i2 = i;
                    return false;
                }
            });

            // opacity of each cell
            $.each(this.ui.tbody.children('tr'), function (i, element) {
                $(element).children('th,td').eq(i2).css('opacity', 'initial');
            });
        }

        window.application.main.dnd.unset();
        this.targetDropElement = null;
    },

    onColumnDragEnter: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (this.targetDropElement) {
            let oldTarget = $(this.targetDropElement);
            oldTarget.css('opacity', 'initial')
                .children('div.table-advanced-label').removeClass('highlight-label');

            let i2;
            $.each(this.ui.thead.children('tr').children('td,th'), function (i, element) {
                if (oldTarget.attr('name') === $(element).attr('name')) {
                    i2 = i;
                    return false;
                }
            });

            // opacity of each cell
            $.each(this.ui.tbody.children('tr'), function (i, element) {
                $(element).children('th,td').eq(i2).css('opacity', 'initial');
            });

            this.targetDropElement = null;
        }

        if (!window.application.main.dnd.isSelector('advanced-table-column')) {
            return false;
        }

        if (e.currentTarget === window.application.main.dnd.get()[0]) {
            return false;
        }

        let target = $(e.currentTarget);
        if (target.hasClass('fixed-column') ||
            target.children('div.table-advanced-label').children('span[draggable=true]').length === 0) {
            return false;
        }

        target.css('opacity', '0.4')
            .children('div.table-advanced-label').addClass('highlight-label');

        if (this.targetDropElement === e.currentTarget) {
            return false;
        }

        let i2;
        $.each(this.ui.thead.children('tr').children('td,th'), function (i, element) {
            if (target.attr('name') === $(element).attr('name')) {
                i2 = i;
                return false;
            }
        });

        // opacity of each cell
        $.each(this.ui.tbody.children('tr'), function (i, element) {
            $(element).children('th,td').eq(i2).css('opacity', '0.4');
        });

        this.targetDropElement = e.currentTarget;

        return false;
    },

    onColumnDragLeave: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        if (!window.application.main.dnd.isSelector('advanced-table-column')) {
            return false;
        }

        if (e.currentTarget === window.application.main.dnd.get()[0]) {
            return false;
        }

        if (this.targetDropElement === e.currentTarget) {
            return false;
        }

        if (window.application.main.dnd.get().children('div.table-advanced-label').length === 0) {
            return false;
        }

        let target = $(e.currentTarget);
        target.css('opacity', 'initial')
            .children('div.table-advanced-label').removeClass('highlight-label');

        let i2;
        $.each(this.ui.thead.children('tr').children('td,th'), function (i, element) {
            if (target.attr('name') === $(element).attr('name')) {
                i2 = i;
                return false;
            }
        });

        // opacity of each cell
        $.each(this.ui.tbody.children('tr'), function (i, element) {
            $(element).children('th,td').eq(i2).css('opacity', 'initial');
        });

        this.targetDropElement = null;

        return false;
    },

    onColumnDragOver: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        return false;
    },

    onColumnDrop: function (e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation();
        }

        if (!window.application.main.dnd.isSelector('advanced-table-column')) {
            return false;
        }

        let target = $(e.currentTarget);
        if (target.hasClass('fixed-column')) {
            return false;
        }

        target.css('opacity', 'initial')
            .children('div.table-advanced-label').removeClass('highlight-label');

        let srcName = window.application.main.dnd.get().attr('name');
        let dstName = target.attr('name');

        if (srcName !== dstName) {
            // switch the two columns
            let i1 = 0, i2 = 0;
            $.each(this.ui.thead.children('tr').children('td,th'), function (i, element) {
                if ($(element).attr('name') === dstName) {
                    i1 = i;
                } else if ($(element).attr('name') === srcName) {
                    i2 = i;
                }
            });

            // switch labels
            let headColumns = $(this.ui.thead.children('tr')[0]).children('th,td');

            if (i1 > i2) {
                headColumns.eq(i2).detach().insertAfter(headColumns.eq(i1))
                    .css('opacity', 'initial')
                    .children('div.table-advanced-label').removeClass('highlight-label');
            } else {
                headColumns.eq(i2).moveBefore(headColumns.eq(i1))
                    .css('opacity', 'initial')
                    .children('div.table-advanced-label').removeClass('highlight-label');
            }

            // switch for any row and reset opacity
            if (i1 < i2) {
                $.each(this.ui.tbody.children('tr'), function (i, element) {
                    let columns = $(element).children('th,td');
                    columns.eq(i2).moveBefore(columns.eq(i1).css('opacity', 'initial'));
                });
            } else {
                $.each(this.ui.tbody.children('tr'), function (i, element) {
                    let columns = $(element).children('th,td');
                    columns.eq(i2).detach().insertAfter(columns.eq(i1).css('opacity', 'initial'));
                });
            }

            let col1 = null, col2 = null;
            for (let i = 0; i < this.displayedColumns.length; ++i) {
                if (this.displayedColumns[i] === this.selectedColumns[i1].name) {
                    col1 = i;
                } else if (this.displayedColumns[i] === this.selectedColumns[i2].name) {
                    col2 = i;
                }
            }

            // switch selectedColumns
            let tmp = this.selectedColumns[i2];

            this.selectedColumns.splice(i2, 1);
            this.selectedColumns.splice(i1, 0, tmp);

            // // switch displayedColumns
            tmp = this.displayedColumns[col2];

            this.displayedColumns.splice(col2, 1);
            this.displayedColumns.splice(col1, 0, tmp);

            // re-adjust columns for some cases
            this.updateColumnsWidth(true);

            // save user settings
            if (this.getUserSettingName()) {
                window.application.updateUserSetting(
                    this.getUserSettingName(),
                    this.selectedColumns,
                    this.getUserSettingVersion());
            }
        }

        return false;
    },

    onResizeColumnHover: function (e) {
        let sizer = $(e.currentTarget);

        // get the previous column
        let column = sizer.parent();
        let columns = column.parent().find('th');

        // adapt the cursor, because if the right column is fixed size, the resize cannot be performed
        $.each(columns, function (i, element) {
            let el = $(element);

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
        let sizer = $(e.currentTarget);

        // get the previous column
        let column = sizer.parent();
        let columns = column.parent().find('th');
        let view = this;

        this.resizingColumnLeft = null;

        $.each(columns, function (i, element) {
            if ($(element).attr('name') === column.attr('name')) {
                // left and right columns directly impacted
                view.resizingColumnLeft = $(columns[i - 1]);
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

    onResizeColumnFinish: function (e) {
        if (this.resizingColumnLeft && this.resizingColumnRight) {
            $('body').removeClass('unselectable');

            let view = this;
            let tableWidth = this.ui.tbody.width();

            let headerRows = this.ui.thead.children('tr').children('td,th');
            $.each(headerRows, function (i, element) {
                let el = $(element);

                // ignored fixed columns width
                if (!el.hasClass('glyph-fixed-column')) {
                    view.selectedColumns[i].width = el.width() / tableWidth;
                } else {
                    view.selectedColumns[i].width = "auto";
                }
            });

            // save user settings
            if (this.getUserSettingName()) {
                window.application.updateUserSetting(
                    this.getUserSettingName(),
                    this.selectedColumns,
                    this.getUserSettingVersion());
            }

            this.resizingColumnLeft = null;
            this.resizingColumnRight = null;
        }
    },

    onResizeColumnMove: function (e) {
        if (this.resizingColumnLeft && this.resizingColumnRight) {
            let delta = e.screenX - this.resizingColumnStartOffset;

            // new width respecting the min width
            let leftWidth = Math.max(
                parseInt(this.resizingColumnLeft.css('min-width').replace('px', '')),
                this.resizingColumnLeftStartWidth + delta);

            let rightWidth = Math.max(
                parseInt(this.resizingColumnRight.css('min-width').replace('px', '')),
                this.resizingColumnRightStartWidth - delta);

            this.resizingColumnLeft.width(leftWidth);
            this.resizingColumnRight.width(rightWidth);

            // define width of header
            // let head = this.ui.thead.children('tr').children('th,td');
            let body = this.ui.tbody.children('tr:first-child').children('th,td');

            // and body
            $(body[this.resizingColumnIndex - 1]).width(leftWidth);
            $(body[this.resizingColumnIndex]).width(rightWidth);

            // // and auto-adjust all columns from body constraints
            // $.each(body, function(i, element) {
            //     let el = $(element);
            //     let headEl = $(head[i]);
            //     let label = headEl.children('div.table-advanced-label');
            //
            //     if (!el.hasClass('glyph-fixed-column')) {
            //         headEl.width(el.width());
            //
            //         // adjust the label div (minus border left width)
            //         label.width(el.width() - (i === 0 ? 0 : 1));
            //     }
            // });

            this.computeClipping();
        }
    },

    capacity: function () {
        let scrollElement = this.getScrollElement();
        return Math.max(1, Math.floor(scrollElement.prop('clientHeight') / this.rowHeight));
    },

    isNeedMoreResults: function () {
        let scrollElement = this.getScrollElement();
        let clientHeight = scrollElement.prop('clientHeight');
        let diff = scrollElement.prop('scrollHeight') - scrollElement.scrollTop() - clientHeight;

        // less than one page in buffer (minus margin height)
        return diff - (scrollElement.outerHeight(true) - scrollElement.height()) <= clientHeight;
    },

    updateScroll: function(topScroll) {
        // locally save scroll position in user settings
        if (this.getUserSettingName()) {
            // last element position
            let state = history.state || {};
            state.scrollPos = topScroll;
            state.numElt =  this.collection.models.length;

            history.replaceState(state, this.getUserSettingName() + '_scrollPos', window.location.pathname);
        }
    },

    scrollOnePage: function (direction) {
        direction !== undefined || (direction = 1);

        let scrollElement = this.getScrollElement();
        let clientHeight = scrollElement.prop('clientHeight');
        let amount = this.capacity() * this.rowHeight;

        // view page scrolling
        scrollElement.scrollTop(scrollElement.scrollTop() + amount * (direction > 0 ? 1 : -1));
    },

    moreResults: function (more, scroll) {
        scroll || (scroll = false);
        more || (more = 20);

        let view = this;

        if (more === -1) {
            more = this.capacity() + 1;
        }

        if (this.collection && this.collection.next) {
            this.collection.fetch({
                update: true, remove: false, data: {
                    cursor: this.collection.next,
                    sort_by: this.collection.sort_by,
                    more: more
                }
            }).then(function (data) {
                // let scrollElement = view.getScrollElement();

                if (scroll) {
                    view.scrollOnePage(1);

                    // // let height = scrollElement.prop('scrollHeight');
                    // let clientHeight = scrollElement.prop('clientHeight');
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
        let view = this;

        return $.when.apply($, []).done(function () {
            view.updateColumnsWidth();
        });
    },

    onRender: function () {
        // if collection in fetched before rendering the view, meaning by null lastModels
        if (!this.lastModels) {
            this.onRefreshChildren();
        }
    },

    onCollectionSync: function (collection, data) {
        // keep list of last queried models, done just once the collection get synced
        this.lastModels = [];

        if (data && data.items && data.items.length > 0) {
            for (let i = 0; i < data.items.length; ++i) {
                this.lastModels.push(this.collection.get(data.items[i].id));
            }

            // post refresh on children once every children was rendered for any other rendering
            this.onRefreshChildren();
        } else {
            this.updateColumnsWidth();
        }

        if (this.initialScrollTop && this.initialMore) {
            // only once reached the minimum content height
            let height = this.getScrollElement().prop('scrollHeight');

            if (this.initialMore - this.collection.models.length > 0) {
                this.moreResults(this.initialMore - this.collection.models.length);
            }

            if (this.initialScrollTop < height && this.initialMore <= this.collection.models.length) {
                this.getScrollElement().scrollTop(this.initialScrollTop);
                this.initialScrollTop = null;
            }
        }
    },

    scroll: function (e) {
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

    computeClipping: function () {
        // adjust left of every columns header
        let head = this.ui.thead.children('tr').children('th,td');
        let body = this.ui.tbody.children('tr:first-child').children('th,td');
        let clientWidth = this.$el.innerWidth();

        let hasScroll = (this.ui.tbody[0].scrollHeight - this.ui.tbody[0].parentNode.parentNode.clientHeight) > 0;

        // let scrollLeft = this.ui.tbody.parent().parent().scrollLeft();
        let leftMargin = window.application.IS_FIREFOX ? 7 : 8;
        let rightMargin = this.ui.add_column.length > 0 ? this.ui.add_column.parent().width() : 0;
        let leftClip = this.ui.table.position().left;
        // let rightClip = this.ui.add_column.length > 0 ? this.ui.add_column.parent().width() : 0;

        if (hasScroll) {
            rightMargin = Math.max(rightMargin, this.scrollbarWidth);
        }

        $.each(head, function (i, element) {
            let el = $(element);
            let row = $(body.get(i));
            let label = el.children('div.table-advanced-label');
            let sizer = el.children('div.column-sizer');

            let left = row.length > 0 ? row.position().left : el.position().left;
            let w = row.length > 0 ? row.width() : el.width();

            label.css('left', left + leftMargin);
            sizer.css('left', left + leftMargin);

            if (left < leftClip) {
                let l = Math.max(0, leftClip - leftMargin - left);
                let r = w + 2;
                label.css('clip', 'rect(0px ' + r + 'px 32px ' + l + 'px)');
                sizer.css('display', 'none');

                if (r - l <= 0) {
                    label.css('display', 'none');
                } else {
                    label.css('display', '');
                }
            } else if (left + w > clientWidth - rightMargin) {
                let l = 0;
                let r = Math.max(0, clientWidth - left/* - rightMargin*/);
                label.css('clip', 'rect(0px ' + r + 'px 32px ' + l + 'px)');

                if (left > clientWidth || r - l <= 0) {
                    label.css('display', 'none');
                    sizer.css('display', 'none');
                } else {
                    label.css('display', '');
                    sizer.css('display', '');

                    // avoid overflow on body that makes a scrollbar or add option button
                    if (!el.hasClass('glyph-fixed-column')) {
                        let minWidth = Math.min(w + 2 - rightMargin, r - l + 8);
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

    getLastModels: function () {
        if (!this.lastModels) {
            this.lastModels = [];
            for (let i = 0; i < this.collection.models.length; ++i) {
                this.lastModels.push(this.collection.models[i]);
            }
        }

        return this.lastModels;
    },

    highlightLabels: function (highlight) {
        let labels = this.ui.thead.children('tr').children('th,td').find('div.table-advanced-label');

        if (highlight) {
            labels.addClass('highlight-label');
        } else {
            labels.removeClass('highlight-label');
        }
    },

    onAddColumnAction: function (e) {
        let contextMenu = this.ui.add_column_menu;
        if (contextMenu.length) {
            if (contextMenu.css('display') === 'block') {
                contextMenu.hide();
            } else {
                let columns = this.getOption('columns') || {};

                // clear previous values
                let ul = contextMenu.children('ul.columns-list').html("");
                let displayedColumns = new Set();

                // add displayed columns first in order
                for (let i = 0; i < this.displayedColumns.length; ++i) {
                    let columnName = this.displayedColumns[i];

                    if (columnName in columns && columns[columnName].fixed)
                        continue;

                    let li = $('<li class="column"></li>');
                    let label = $('<label tabindex="-1" name="' + columnName + '"><input type="checkbox" checked=""/></label>');
                    li.append(label);

                    label.prop("displayed", true);

                    label.append('&nbsp;' + (this.getOption('columns')[columnName].label || columnName));
                    ul.append(li);

                    displayedColumns.add(columnName);
                }

                // append others columns by alpha order
                let columnsByLabel = [];

                for (let columnName in columns) {
                    let column = columns[columnName];
                    columnsByLabel.push({
                        name: columnName,
                        label: column.label || columnName
                    });
                }

                columnsByLabel.sort(function (a, b) {
                    return a.label.localeCompare(b.label);
                });

                for (let c in columnsByLabel) {
                    let column = columnsByLabel[c];

                    if (column.name in columns && columns[column.name].fixed)
                        continue;

                    if (!displayedColumns.has(column.name)) {
                        let li = $('<li class="column"></li>');
                        let label = $('<label tabindex="-1" name="' + column.name + '"><input type="checkbox"/></label>');
                        li.append(label);

                        label.prop("displayed", false);

                        label.append('&nbsp;' + column.label);
                        ul.append(li);
                    }
                }

                contextMenu.css({
                    display: "block",
                    left: this.ui.add_column.parent().position().left - contextMenu.width(),
                    top: this.ui.add_column.parent().position().top + this.ui.add_column.height(),
                    'tab-index': 0
                }).addClass('glasspane-top-of');

                // focus on text field
                contextMenu.find('input[name="add-column-filter"]').val("").focus();

                // height must be inside of the window
                let maxHeight = $(window).height() - (this.ui.add_column.parent().offset().top + this.ui.add_column.height()) - 20;
                maxHeight -= contextMenu.children('div.input-group').outerHeight() + contextMenu.children('div.btn-group').outerHeight();
                maxHeight -= ul.outerHeight() - ul.height();
                ul.css('max-height', maxHeight + 'px').css('overflow-y', 'auto');

                // hide header highlight
                if (this.controlKeyDown) {
                    this.controlKeyDown = false;
                    this.highlightLabels(false);
                }

                // hide the context menu when click on the glass pane
                window.application.main.glassPane('show').on('click', function (e) {
                    contextMenu.hide();
                    return true;
                });
            }
        }
    },

    /**
     * Remove a column given its name.
     * @param columnName Column name.
     * @param save If true save user settings.
     * @returns boolean if success.
     */
    removeColumn: function (columnName, save) {
        let columnId = -1;

        for (let j = 0; j < this.displayedColumns.length; ++j) {
            if (this.displayedColumns[j] === columnName) {
                columnId = j;
                break;
            }
        }

        if (columnId === -1) {
            return false;
        }

        this.displayedColumns.splice(columnId, 1);

        let headerCol = this.ui.thead.children('tr').children('th[name="' + columnName + '"]');
        headerCol.remove();

        let bodyCol = this.ui.tbody.children('tr').children('td[name="' + columnName + '"]');
        bodyCol.remove();

        // update user setting
        for (let i = 0; i < this.selectedColumns.length; ++i) {
            if (this.selectedColumns[i].name === columnName) {
                this.selectedColumns.splice(i, 1);
                break;
            }
        }

        if (save) {
            if (this.getUserSettingName()) {
                window.application.updateUserSetting(
                    this.getUserSettingName(),
                    this.selectedColumns,
                    this.getUserSettingVersion()
                );
            }
        }

        return true;
    },

    addColumn: function (columnName, save) {
        let columnId = -1;
        let self = this;

        let column = this.getOption('columns')[columnName];
        this.displayedColumns.push(columnName);

        // insert the new column dynamically
        let th = $('<th></th>');
        th.attr('name', columnName);
        th.addClass('unselectable');

        let labelOrGlyph = $('<span>' + (this.getOption('columns')[columnName].label || columnName) + '</span>');
        if (!column.fixed) {
            labelOrGlyph.prop('draggable', true);
        }

        if (column.minWidth) {
            th.addClass("title-column");
        }

        let sorter = $('<span class="column-sorter fa fa-sort action sortby-asc-column column-action"></span>');
        th.append(sorter);

        if (typeof(column.glyphicon) === "string") {
            labelOrGlyph.addClass("fa " + column.glyphicon);
            th.addClass('glyph-fixed-column');
        }

        let cellClassName = "";
        if (typeof(column.event) === "string") {
            cellClassName = "action " + column.event;
        }

        if (column.fixed) {
            th.addClass('fixed-column');
        }

        th.append(labelOrGlyph);

        this.ui.thead.children('tr').append(th);

        let collection = this.collection;
        let rows = this.ui.tbody.children('tr');

        $.each(rows, function (i, element) {
            let el = $(element);
            let item = collection.get(el.attr('element-id'));
            let cell = $('<td></td>');
            cell.attr('name', columnName);
            cell.addClass(cellClassName);

            if (column.custom) {
                // deferred
            } else if (column.glyphicon) {
                let span = $('<span class="fa"></span>');
                span.addClass(column.glyphicon[1]);
                cell.html(span);
            } else if (!column.format) {
                cell.html(item.get(columnName.replace(/^[#@\$]/, '')));
            } else if (column.query) {
                // deferred
            } else if (columnName.startsWith('#')) {
                cell.html(item.get('descriptors')[columnName.replace(/^#/, '')] || "");
            }

            el.append(cell);
        });

        // update user setting
        this.selectedColumns.push({
            name: columnName,
            width: null,
            sort_by: null
        });

        // refresh only the new column on every row
        this.onRefreshChildren(true, this.displayedColumns.slice(-1)).done(function () {
            // save once refresh is done completely
            if (self.getUserSettingName()) {
                window.application.updateUserSetting(
                    self.getUserSettingName(),
                    self.selectedColumns,
                    self.getUserSettingVersion()
                );
            }
        });

        if (save) {
            if (this.getUserSettingName()) {
                window.application.updateUserSetting(
                    this.getUserSettingName(),
                    this.selectedColumns,
                    this.getUserSettingVersion()
                );
            }
        }

        return true;
    },

    onAddRemoveColumn: function () {
        let contextMenu = this.ui.add_column_menu;
        let labels = contextMenu.children('ul.columns-list').children('li.column').children('label');
        let self = this;

        // hide the dialog
        contextMenu.hide();

        // destroy the glass pane
        window.application.main.glassPane('destroy');

        // first remove columns
        $.each(labels, function (i, element) {
            let el = $(element);
            let columnName = el.attr('name');

            if (el.prop('displayed') && !el.children('input').prop('checked')) {
                self.removeColumn(columnName, false);
            }
        });

        // then add others
        labels = contextMenu.children('ul.columns-list').children('li.column').children('label');
        $.each(labels, function (i, element) {
            let el = $(element);
            let columnName = el.attr('name');

            if (!el.prop('displayed') && el.children('input').prop('checked')) {
                self.addColumn(columnName, false);
            }
        });

        this.updateColumnsWidth(true);

        if (this.getUserSettingName()) {
            window.application.updateUserSetting(
                this.getUserSettingName(),
                this.selectedColumns,
                this.getUserSettingVersion()
            );
        }
    },

    getSortField: function (columnName) {
        // not column descriptor simply returns the column name
        if (!columnName in this.getOption('columns')) {
            return columnName;
        }

        let column = this.getOption('columns')[columnName];

        if ("format" in column) {
            if ("field" in column && column.field && column.format && column.format.type === "count") {
                // count
                return column.field;
            } else if ("field" in column && column.field) {
                // sub-field
                return columnName + "->" + column.field;
            } else if ("sortby_field" in column.format && column.format.sortby_field) {
                // sub-field
                return columnName + "->" + column.format.sortby_field;
            } else {
                // unknown
                return columnName;
            }
        } else if ("field" in column && column.field) {
            return columnName + '->' + column.field;
        } else {
            return columnName;
        }
    },

    onSortColumn: function (e) {
        let el = $(e.target);
        let columnEl = $(e.target).parent().parent();
        let columnName = columnEl.attr('name');
        let sortField = this.getSortField(columnName);
        let order = '+';
        let headers = this.ui.thead.children('tr').children('th,td').find('div.table-advanced-label'); //  span.column-sorter');
        let sortBy = _.clone(this.collection.sort_by) || [];

        let i = -1;
        for (let j = 0; j < sortBy.length; ++j) {
            if (sortBy[j] === sortField || sortBy[j].slice(1) === sortField) {
                i = j;
                break;
            }
        }

        if (i !== -1) {
            order = sortBy[i][0] === '-' ? '-' : '+';
            // toggle current sorter order
            order = order === '+' ? '-' : (order === '-' ? '' : '+');
        }

        if (!this.controlKeyDown) {
            // cleanup
            headers.children('span.column-sorter').removeClass(
                'sortby-asc-column sortby-desc-column fa-sort-asc fa-sort-desc')
                .attr('sort-position', null)
                .empty();

            if (order === '+') {
                el.addClass('sortby-asc-column fa-sort-asc');
            } else if (order === '-') {
                el.addClass('sortby-desc-column fa-sort-desc');
            } else {
                el.addClass('fa-sort');
            }

            if (order === '') {
                sortBy = [];
            } else {
                sortBy = [order + sortField];
                el.attr('sort-position', 0);
            }
        } else {
            // multiple
            if (order === '+') {
                el.removeClass('sortby-desc-column fa-sort-desc');
                el.addClass('sortby-asc-column fa-sort-asc');
            } else if (order === '-') {
                el.removeClass('sortby-asc-column fa-sort-asc');
                el.addClass('sortby-desc-column fa-sort-desc');
            } else {
                el.removeClass('sortby-asc-column sortby-desc-column fa-sort-asc fa-sort-desc');
                el.addClass('fa-sort');
                el.attr('sort-position', null);
            }

            if (i >= 0) {
                if (order === '') {
                    sortBy.splice(i, 1);
                    el.empty().attr('sort-position', null);

                    // reorder previous
                    $.each(headers, function (n, el) {
                        let sorter = $(el);
                        if (sorter.length) {
                            let pos = parseInt(sorter.attr('sort-position') || -1);

                            if (pos > i) {
                                --pos;
                                sorter.attr('sort-position', pos);
                            }
                        }
                    });
                } else {
                    sortBy[i] = order + sortField;
                    el.attr('sort-position', i);
                }
            } else {
                sortBy.push(order + sortField);
                el.attr('sort-position', sortBy.length - 1);
            }

            // assign order
            $.each(headers, function (n, el) {
                let sorter = $(el).children('span.column-sorter');
                if (sorter.length) {
                    let pos = parseInt(sorter.attr('sort-position') || -1);

                    if (pos >= 0 && sortBy.length > 1) {
                        sorter.text(EXPONENT_MAP[pos] || '');
                    } else {
                        sorter.text('');
                    }
                }
            });
        }

        // update user columns setting
        for (let i = 0; i < this.selectedColumns.length; ++i) {
            let sorter = $(headers[i]).children('span.column-sorter');
            let pos = sorter.attr('sort-position');

            if (sorter.hasClass('sortby-asc-column')) {
                this.selectedColumns[i].sort_by = '+' + pos;
            } else if (sorter.hasClass('sortby-desc-column')) {
                this.selectedColumns[i].sort_by = '-' + pos;
            } else {
                this.selectedColumns[i].sort_by = null;
            }
        }

        // reset and fetch collection
        this.collection.fetch({
            reset: true, data: {
                sort_by: sortBy,
                more: Math.max(this.capacity() + 1, 30)
            }
        });

        // and save them
        if (this.getUserSettingName()) {
            window.application.updateUserSetting(
                this.getUserSettingName(),
                this.selectedColumns,
                this.getUserSettingVersion());
        }
    },

    onWindowLostFocus: function (e) {
        if (e.target !== window) {
            return false;
        }

        if (this.controlKeyDown) {
            this.controlKeyDown = false;
            this.highlightLabels(false);

            return true;
        }
    },

    onKeyDown: function (e) {
        if (e.key === 'Control') {
            if (!window.application.main.isForeground(this)) {
                return false;
            }

            if (!this.controlKeyDown) {
                this.controlKeyDown = true;
                this.highlightLabels(true);
            }
        } else if (e.key === 'Escape') {
            // hide the context menu on ESCAPE key (and the glass-pane)
            window.application.main.glassPane('destroy');
            this.ui.add_column_menu.hide();
        }
    },

    onKeyUp: function (e) {
        if (e.key === 'Control') {
            if (this.controlKeyDown) {
                this.controlKeyDown = false;
                this.highlightLabels(false);
            }
        }
    },

    onClickHead: function (e) {
        let el = $(e.target);
        let parent = null;

        if (el.is('th')) {
            parent = el;
            el = el.children('div').children();
        } else if (el.is('th div span')) {
            parent = el.parent('div').parent('th');
        }

        let columnName = parent && parent.length ? parent.attr('name') : undefined;
        if (!parent || !el || !columnName) {
            return;
        }

        let columns = this.getOption('columns') || {};
        if (!(columnName in columns)) {
            return;
        }

        if (columns[columnName].type === "checkbox") {
            let checkbox = el;

            // checkbox.parent().css('background-color', 'initial');


            if (checkbox.hasClass('fa-square-o')) {
                checkbox.removeClass('fa-square-o');
                checkbox.addClass('fa-check-square-o');

                // check every ones
                this.ui.tbody.children('tr').children('td[name=' + columnName + ']').children('span.fa-square-o')
                    .removeClass('fa-square-o')
                    .addClass('fa-check-square-o');

                columns[columnName].autoSelect = true;
                columns[columnName].selection = true;
            } else {
                checkbox.removeClass('fa-check-square-o').removeClass('fa-minus-square-o');
                checkbox.addClass('fa-square-o');

                // uncheck every ones
                this.ui.tbody.children('tr').children('td[name=' + columnName + ']').children('span.fa-check-square-o')
                    .removeClass('fa-check-square-o')
                    .addClass('fa-square-o');

                columns[columnName].autoSelect = false;
                delete columns[columnName].selection;
            }
        }
    },

    onClickBody: function (e) {
        let el = $(e.target);
        let parent = null;

        if (el.is('td')) {
            parent = el;
            el = el.children();
        } else if (el.is('td span')) {
            parent = el.parent('td');
        }

        let columnName = parent && parent.length ? parent.attr('name') : undefined;
        if (!parent || !el || !columnName) {
            return;
        }

        let columns = this.getOption('columns') || {};
        if (!(columnName in columns)) {
            return;
        }

        let id = parseInt(parent.parent('tr').attr('element-id'));

        // manage checkbox columns for selection
        if (columns[columnName].type === "checkbox") {
            let checkbox = el;

            if (checkbox.hasClass('fa-square-o')) {
                checkbox.removeClass('fa-square-o');
                checkbox.addClass('fa-check-square-o');

                if (!(columns[columnName].selection instanceof Object)) {
                    columns[columnName].selection = {
                        'type': columns[columnName].autoSelect ? 'exclude' : 'include',
                        'list': new Set()
                    }
                }

                if (columns[columnName].autoSelect) {
                    columns[columnName].selection.list.delete(id);
                } else {
                    columns[columnName].selection.list.add(id);
                }

                if (columns[columnName].selection.list.size === 0) {
                    columns[columnName].selection = columns[columnName].autoSelect || false;
                }
            } else {
                checkbox.removeClass('fa-check-square-o');
                checkbox.addClass('fa-square-o');

                if (!(columns[columnName].selection instanceof Object)) {
                    columns[columnName].selection = {
                        'type': columns[columnName].autoSelect ? 'exclude' : 'include',
                        'list': new Set()
                    }
                }

                if (columns[columnName].autoSelect) {
                    columns[columnName].selection.list.add(id);
                } else {
                    columns[columnName].selection.list.delete(id);
                }

                if (columns[columnName].selection.list.size === 0) {
                    columns[columnName].selection = columns[columnName].autoSelect || false;
                }
            }

            let headCheckbox = this.ui.thead.children('tr').children('th[name=' + columnName + ']').children('div').children('span');

            if (columns[columnName].selection === false) {
                // headCheckbox.parent().css('background-color', 'initial');
                headCheckbox.removeClass('fa-check-square-o').removeClass('fa-minus-square-o')
                    .addClass('fa-square-o');

                // none check on head
                if (!headCheckbox.hasClass('fa-square-o')) {
                    headCheckbox.removeClass('fa-check-square-o')
                        .addClass('fa-square-o');
                }
            } else if (columns[columnName].selection === true) {
                // headCheckbox.parent().css('background-color', 'initial');
                headCheckbox.removeClass('fa-square-o').removeClass('fa-minus-square-o')
                    .addClass('fa-check-square-o');

                // none check on head
                if (!headCheckbox.hasClass('fa-check-square-o')) {
                    headCheckbox.removeClass('fa-square-o')
                        .addClass('fa-check-square-o');
                }
            } else {
                // headCheckbox.parent().css('background-color', '#5cb85c');
                headCheckbox.removeClass('fa-square-o')
                    .addClass('fa-minus-square-o');
            }
        }
    },

    /**
     * Get the list or state of selection for a compatible column.
     * @param columnName Column name.
     * @returns {term: string, op: string, value: Array} Boolean or a Object. true mean all objects are selected, false none.
     */
    getSelection: function (columnName) {
        let columns = this.getOption('columns') || {};
        if (!(columnName in columns)) {
            return false;
        }

        if (columns[columnName].type === "checkbox") {
            if (columns[columnName].selection instanceof Object) {
                return {
                    'term': 'id',
                    'op': columns[columnName].selection.type === 'include' ? 'in' : 'notin',
                    'value': Array.from(columns[columnName].selection.list)
                }
            } else {
                return columns[columnName].selection || false;
            }
        } else {
            return false;
        }
    }
});

module.exports = View;
