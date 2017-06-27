/**
 * @file accessionlistfooter.js
 * @brief Filter and configuration for the list of accession
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-22
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'accession-footer',
    template: require('../templates/accessionlistfooter.html'),

    ui: {
        filter_btn: 'button.accession-filter',
        accession_field: 'select.accession-field',
        search_value: 'input.search-value',
        search_group: 'div.search-value-group',
        accession_advanced_search: 'button.accession-advanced-search'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'change @ui.accession_field': 'onChangeField',
        'input @ui.search_value': 'onSearchValue',
        'click @ui.accession_advanced_search': 'onAdvancedSearch'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onRender: function() {
        var columns = this.getOption('columns') || {};

        // append others columns by alpha order
        var columnsByLabel = [];

        for (var columnName in columns) {
            var column = columns[columnName];
            columnsByLabel.push({
                name: columnName,
                label: column.label
            });
        }

        columnsByLabel.sort(function(a, b) {
            return a.label.localeCompare(b.label);
        });

        for (var c in columnsByLabel) {
            var column = columnsByLabel[c];

            var option = $('<option>' + column.label + '</option>');
            option.attr('value', column.name);

            this.ui.accession_field.append(option);
        }

        $(this.ui.accession_field).selectpicker({
            style: 'btn-default',
            container: 'body'
        }).selectpicker('val', 'name');
    },

    onFilter: function () {
        if (this.validateSearchValue()) {
            var field = this.ui.accession_field.val();
            var op = "eq";
            var value = null;

            if (field === "name") {
                op = "icontains";
            }

            if (this.widget) {
                value = this.widget.values();
            } else {
                value = this.ui.search_value.val().trim();
            }

            if (value !== null) {
                this.collection.filters = [{
                    type: 'term',
                    field: field,
                    value: value,
                    op: op
                }];
            } else {
                this.collection.filters = null;
            }

            // this.collection.filters = [{
            //     type: 'term',
            //     field: 'name',
            //     value: this.ui.accession_name.val().trim(),
            //     op: "icontains"
            // }, {
            //     type: 'op',
            //     value: 'and'
            // }, [{
            //     type: 'term',
            //     field: '#MCPD_ORIGCTY->name',
            //     value: 'France',
            //     op: "neq"
            // }, {
            //     type: 'op',
            //     value: 'or'
            // }, {
            //     type: 'term',
            //     field: '#IPGRI_4.1.1->value1',
            //     value: 'Hiver',
            //     op: "eq"
            // }, []]];

            this.collection.fetch({reset: true});
            this.collection.count();
        }
    },

    validateSearchValue: function() {
        var v = this.ui.search_value.val().trim();
        var field = this.ui.accession_field.val();
        var column = this.getOption('columns')[field] || {};

        if (field === 'name' || field === 'code')
        {
            if (v.length > 0 && v.length < 3) {
                $(this.ui.search_value).validateField('failed', gt.gettext('3 characters min'));
                return false;
            } else if (this.ui.search_value.val().length === 0) {
                $(this.ui.search_value).cleanField();
                return true;
            } else {
                $(this.ui.search_value).validateField('ok');
                return true;
            }
        } else {
            return true;
        }
    },

    onSearchValue: function () {
        return this.validateSearchValue();
    },

    onChangeField: function () {
        var field = this.ui.accession_field.val();
        var column = this.getOption('columns')[field] || {};

        if (this.widget) {
            this.widget.destroy();
            this.widget = null;
        }

        this.ui.search_group.empty();

        if (column.format) {
            this.widget = application.descriptor.widgets.newElement(column.format.type);
            if (this.widget) {
                this.widget.create(column.format, this.ui.search_group, false, column.group, column.type);
            }
        } else {
            var input = $('<input type="text" class="search-value form-control" name="search-value"/>');
            this.ui.search_group.append(input);
        }
    }
});

module.exports = View;
