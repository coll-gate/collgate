/**
 * @file exportdialog.js
 * @brief Data export options dialog
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-08-31
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Dialog = require('./dialog');

let View = Dialog.extend({
    attributes: {
        'id': 'dlg_export'
    },
    template: require('../templates/exportdialog.html'),

    ui: {
        confirm: 'button.confirm',
        format: 'select[name="format"]'
    },

    events: {
        'click @ui.confirm': 'onConfirm'
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        this.collection = options.collection;
        this.exportedColumns = options.exportedColumns;

        this.exportFormat = null;
    },

    onRender: function () {
        View.__super__.onRender.apply(this);

        this.ui.format.selectpicker({});
    },

    onBeforeDestroy: function() {
        this.ui.format.selectpicker('destroy');
        View.__super__.onBeforeDestroy.apply(this);
    },

    onConfirm: function() {
        this.exportFormat = this.ui.format.selectpicker('val');
        this.doExport();

        this.destroy();
        this.trigger('dialog:confirm');
    },

    getFormat: function() {
        return this.exportFormat;
    },

    doExport: function() {
        let columns = this.exportedColumns;

        let dataFormat = this.ui.format.selectpicker('val');
        let form = $('<form></form>');

        form.append('<input type="text" name="app_label" value="accession">');
        form.append('<input type="text" name="model" value="accession">');

        if (this.collection.filters && !_.isEmpty(this.collection.filters)) {
            let p = [];
            for (let i = 0; i < this.collection.filters.length; ++i) {
                p.push(JSON.stringify(this.collection.filters[i]));
            }

            let f = '[' + p.join(',') + ']';

            form.append('<input type="text" name="filters">');
            form.children("[name=filters]").attr("value", f);
        }

        if (this.collection.search && !_.isEmpty(this.collection.search)) {
            form.append('<input type="text" name="search" value="' + $.param(this.collection.search) + '">');

            let p = [];
            for (let i = 0; i < this.collection.search.length; ++i) {
                p.push(JSON.stringify(this.collection.search[i]));
            }

            let f = '[' + p.join(',') + ']';

            form.append('<input type="text" name="search">');
            form.children("[name=search]").attr("value", f);
        }

        if (dataFormat === 'csv') {
            // download the document as csv
            form.append('<input type="text" name="format" value="csv">');

            for (let col in columns) {
                form.append('<input type="text" name="columns[]" value="' + columns[col] + '">');
            }

            form.attr('action', window.application.url(['main', 'export'])).appendTo('body').submit().remove();
        } else if (dataFormat === 'xlsx') {
            // download the document as xlsx
            form.append('<input type="text" name="format" value="xlsx">');

            for (let col in columns) {
                form.append('<input type="text" name="columns[]" value="' + columns[col] + '">');
            }

            form.attr('action', window.application.url(['main', 'export'])).appendTo('body').submit().remove();
        }
    }
});

module.exports = View;
