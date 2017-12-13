/**
 * @file entitylistfilter.js
 * @brief Filter the list of describable entity
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-03
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'entity-list-filter',
    template: require('../templates/entitylistfilter.html'),

    ui: {
        filter_btn: 'button.entity-filter',
        entity_field: 'select.entity-field',
        search_value: 'input.search-value',
        search_group: 'div.search-value-group'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'change @ui.entity_field': 'onChangeField',
        'input @ui.search_value': 'onSearchValue'
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onRender: function() {
        let columns = this.getOption('columns') || {};

        // append others columns by alpha order
        let columnsByLabel = [];

        for (let columnName in columns) {
            let column = columns[columnName];
            columnsByLabel.push({
                name: columnName,
                label: column.label || columnName
            });
        }

        columnsByLabel.sort(function(a, b) {
            return a.label.localeCompare(b.label);
        });

        for (let c in columnsByLabel) {
            let column = columnsByLabel[c];

            let option = $('<option>' + column.label + '</option>');
            option.attr('value', column.name);

            this.ui.entity_field.append(option);
        }

        $(this.ui.entity_field).selectpicker({
            style: 'btn-default',
            container: 'body'
        }).selectpicker('val', 'name');

        // initial
        this.onChangeField();
    },

    onFilter: function () {
        if (this.validateSearchValue()) {
            let field = this.ui.entity_field.val();
            let op = "eq";
            let value = null;

            if (field === "name" || field === "@label") {
                op = "icontains";
            }

            if (this.widget) {
                value = this.widget.values();
            } else {
                value = this.$el.find(".search-value").val().trim();
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

            this.collection.fetch({
                reset: true,
                data: {
                    sort_by: this.collection.sort_by
                }
            });
            this.collection.count();
        }
    },

    validateSearchValue: function() {
        if (!this.widget) {
            let v = this.$el.find(".search-value").val().trim();

            if (v.length > 0 && v.length < 3) {
                this.$el.find(".search-value").validateField('ok');
                return true;
            } else if (this.$el.find(".search-value").val().length === 0) {
                this.$el.find(".search-value").cleanField();
                return true;
            } else {
                this.$el.find(".search-value").validateField('ok');
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
        let field = this.ui.entity_field.val();
        let column = this.getOption('columns')[field] || {};

        if (this.widget) {
            this.widget.destroy();
            this.widget = null;
        }

        this.ui.search_value.cleanField();
        this.ui.search_group.empty();

        if (column.format) {
            this.widget = application.descriptor.widgets.newElement(column.format.type);
            if (this.widget) {
                this.widget.create(column.format, this.ui.search_group, {
                    readOnly: false,
                    descriptorTypeId: column.type
                });

                return;
            }

            this.widget = null;
        }

        let input = $('<input type="text" class="search-value form-control" name="search-value"/>');
        this.ui.search_group.append(input);
    }
});

module.exports = View;
