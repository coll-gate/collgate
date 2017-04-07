/**
 * @file columnsconfig.js
 * @brief Dialog to configure columns to display for list view.
 * @author Frederic SCHERMA
 * @date 2017-04-06
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Dialog.extend({
    attributes: {
        'id': 'dlg_columns_config'
    },
    template: require('../templates/columnsconfig.html'),
    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.columns,
            selectedColumns: this.selectedColumns
        };
    },

    ui: {
        apply: "button.apply"
    },

    events: {
        'click @ui.apply': 'onApply'
    },

    initialize: function (options) {
        options || (options = {columns: {}});

        View.__super__.initialize.apply(this, options);

        // @todo parameter
        this.selectedColumns = application.getUserSetting('accessions_list_columns');

        var columns = [];
        var used = new Set();

        for (var i = 0; i < this.selectedColumns.length; ++i) {
            var column_name = this.selectedColumns[i].name;

            columns.push({
                name: column_name,
                label: options.columns[column_name].label,
                query: options.columns[column_name].query || false,
                checked: true
            });

            used.add(column_name);
        }

        this.columns = columns;
        for (var key in options.columns) {
            if (!used.has(key)) {
                var column = options.columns[key];

                this.columns.push({
                    name: key,
                    label: column.label,
                    query: column.query || false,
                    checked: false
                });
            }
        }
    },

    onRender: function () {
        View.__super__.onRender.apply(this);
    },

    onBeforeDestroy: function() {
        View.__super__.onBeforeDestroy.apply(this);
    },

    onApply: function() {
        var view = this;
        this.destroy();
    }
});

module.exports = View;
