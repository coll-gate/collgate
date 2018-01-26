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
        operator: 'select[name=operator]',
        search_value: 'input.search-value',
        search_group: 'div.search-value-group'
    },

    events: {
        'click @ui.filter_btn': 'onFilter',
        'change @ui.entity_field': 'onChangeField',
        'change @ui.operator': 'onChangeOperator',
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

        let defaultField = false;
        for (let c in columnsByLabel) {
            let column = columnsByLabel[c];

            let option = $('<option>' + column.label + '</option>');
            option.attr('value', column.name);

            this.ui.entity_field.append(option);

            if (column.name === "name") {
                defaultField = true;
            }
        }

        this.ui.entity_field.selectpicker({
            style: 'btn-default',
            container: 'body'
        });

        if (defaultField) {
            this.ui.entity_field.selectpicker('val', 'name');
        }

        // initial
        this.onChangeField();
    },

    onFilter: function () {
        if (this.validateSearchValue()) {
            let field = this.ui.entity_field.val();
            let op = this.ui.operator.val();
            let value = null;

            if (field === "name" || field === "@label") {
                op = "icontains";
            }

            if (this.widget) {
                value = this.widget.values();
            } else {
                value = this.$el.find(".search-value").val().trim();
            }

            if (value !== null || op === "isnull" || op === "notnull") {
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
        let self = this;
        let field = this.ui.entity_field.val();
        let column = this.getOption('columns')[field] || {};

        if (this.widget) {
            this.widget.destroy();
            this.widget = null;
        }

        this.ui.search_value.cleanField();
        this.ui.search_group.empty();

        let operators_labels = {
            'isnull': _t('Undefined'),
            'notnull': _t('Defined'),
            'eq': _t('Exact'),
            'neq': _t('Different from'),
            'in': _t('Include'),
            'notin': _t('Not include'),
            'icontains': _t('Contains'),
            'lte': _t('Lesser than'),
            'gte': _t('Greater than'),
            'contains': _t('belong to (intersection)'),
            'not_contains': _t('Not belong to (intersection)'),
            'overlap': _t('Belong to (union)'),
            'not_overlap': _t('Not belong to (union)'),
            'contained_by': _t('Contained by'),
            'not_contained_by': _t('Not contained by')
        };

        let operators = column.available_operators || ['eq', 'neq'];
        this.ui.operator.children('option').remove();

        if (operators) {
            for (let i = 0; i < operators.length; i++) {
                let operator_code = operators[i];
                this.ui.operator.append('<option value="' + operator_code + '">' + operators_labels[operator_code] + '</option>');
            }

            this.ui.operator.selectpicker('refresh');
            if (operators) {
                if (operators.includes('eq')) {
                    this.ui.operator.selectpicker().selectpicker('val', 'eq');
                } else {
                    this.ui.operator.selectpicker().selectpicker('val', operators[0]);
                }
            }
        }

        if (column.format) {
            this.widget = window.application.descriptor.widgets.newElement(column.format.type);
            if (this.widget) {
                this.widget.create(column.format, this.ui.search_group, {
                    readOnly: false,
                    descriptorTypeId: column.type
                });

                this.widget.el.on('keydown', function(e) {
                    if (e.keyCode === 13) {
                       self.onFilter();
                    }
                }).on('input', $.proxy(this.onSearchValue, this));

                return;
            }

            this.widget = null;
        }

        // or default input
        let input = $('<input type="text" class="search-value form-control" name="search-value"/>');
        this.ui.search_group.append(input);

        input.on('keydown', function(e) {
            if (e.keyCode === 13) {
               self.onFilter();
            }
        }).on('input', $.proxy(this.onSearchValue, this));
    },

    onChangeOperator: function() {
        let self = this;
        let field = this.ui.entity_field.val();
        let column = this.getOption('columns')[field] || {};
        let op = this.ui.operator.val();

        if (this.widget) {
            this.widget.destroy();
            this.widget = null;
        }

        this.ui.search_value.cleanField();
        this.ui.search_group.empty();

        if (column.format) {
            this.widget = window.application.descriptor.widgets.newElement(column.format.type);
            if (this.widget) {
                this.widget.create(column.format, this.ui.search_group, {
                    multiple: op === "in" || op === "notin",
                    readOnly: false,
                    descriptorTypeId: column.type
                });

                this.widget.el.on('keydown', function(e) {
                    if (e.keyCode === 13) {
                       self.onFilter();
                    }
                }).on('input', $.proxy(this.onSearchValue, this));

                return;
            }

            this.widget = null;
        }

        // or default input
        let input = $('<input type="text" class="search-value form-control" name="search-value"/>');
        this.ui.search_group.append(input);

        input.on('keydown', function(e) {
            if (e.keyCode === 13) {
               self.onFilter();
            }
        }).on('input', $.proxy(this.onSearchValue, this));
    }
});

module.exports = View;
