/**
 * @file searchcondition.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-06-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'div',
    className: 'condition',
    template: require('../templates/searchcondition.html'),
    templateContext: function () {
        return {first_element: this.first_element}
    },

    ui: {
        remove: 'span.action.remove',
        field: 'div.field select',
        condition: 'div.condition select',
        field_value: '.input-group input',
        field_value_group: 'div.field_value div.form-group',
        row_operator: 'div.operator select',
        left_parenthesis: 'span.action.parenthesis.parenthesis-left',
        right_parenthesis: 'span.action.parenthesis.parenthesis-right'
    },

    events: {
        'click @ui.remove': 'onRemove',
        'change @ui.condition': 'onConditionChange',
        'change @ui.field': 'onChangeField',
        'change @ui.field_value': 'onUIChange',
        'change @ui.row_operator': 'onUIChange',
        'click @ui.left_parenthesis': 'onOpenGroup',
        'click @ui.right_parenthesis': 'onCloseGroup'
    },

    initialize: function (options) {
        this.parent = options.parent;
        this.columns = {};
        this.first_element = (this.model.collection.models[0] === this.model);
        this.open_group = 0;
        this.close_group = 0;
    },

    onRender: function () {
        var operator = this.$el.find('div.search-condition').find('div.operator').children('div').children('select');
        operator.append('<option value="and">' + _t('AND') + '</option>');
        operator.append('<option value="or">' + _t('OR') + '</option>');
        operator.selectpicker({}).selectpicker('val', 'and');

        if (this.first_element) {
            this.$el.find('div.search-condition').find('div.operator').parent().hide();
        } else {
            operator.selectpicker({}).selectpicker('val', this.model.get('operator'));
        }

        this.ui.condition.selectpicker({container: '.modal'});
        this.ui.field.selectpicker({
            liveSearch: true,
            container: '.modal'
        });

        this.ui.field.val(this.model.get('field'));
        this.ui.condition.val(this.model.get('condition'));
        this.ui.field_value.val(this.model.get('field_value'));
    },

    onConditionChange: function () {
        var field = this.ui.field.val();
        var column = this.columns[field];

        if (this.widget.allow_multiple) {
            this.widget.destroy();

            if ([
                    'in',
                    'notin',
                    'contains',
                    'not_contains',
                    'contained_by',
                    'not_contained_by',
                    'overlap',
                    'not_overlap'
                ].includes(this.ui.condition.val())) {
                this.widget.create(column.format, this.ui.field_value_group, false, column.group, column.type, {
                    multiple: true,
                    extended_search: false
                });
            } else {
                this.widget.create(column.format, this.ui.field_value_group, false, column.group, column.type, {
                    multiple: false,
                    extended_search: false
                });
            }
        } else {
            if ([
                    'in',
                    'notin',
                    'contains',
                    'not_contains',
                    'contained_by',
                    'not_contained_by',
                    'overlap',
                    'not_overlap'
                ].includes(this.ui.condition.val())) {
                this.ui.field_value_group.find('select').prop('multiple', true).selectpicker('destroy').selectpicker({container: '.modal'});
            } else {
                this.ui.field_value_group.find('select').prop('multiple', false).selectpicker('destroy').selectpicker({container: '.modal'});
            }
        }
        this.onUIChange();
    },

    onUIChange: function () {
        if (this.ui.condition.val() === 'isnull' || this.ui.condition.val() === 'notnull') {
            this.ui.field_value_group.hide();
        } else {
            this.ui.field_value_group.show();
        }

        var value = null;
        var operator = null;

        if (this.widget) {
            value = this.widget.values();
        } else {
            value = this.$el.find('.input-group input').val();
        }
        if (!this.first_element) {
            operator = this.ui.row_operator.val()
        }
        this.model.set({
            row_operator: operator,
            field: this.ui.field.val(),
            condition: this.ui.condition.val(),
            field_value: value,
            open_group: this.open_group,
            close_group: this.close_group
        });
    },

    onOpenGroup: function () {
        switch (this.open_group) {
            case 0:
                this.open_group = 1;
                this.ui.left_parenthesis.addClass('activated');
                this.ui.left_parenthesis.html('[');
                break;

            case 1:
                this.open_group = 2;
                this.ui.left_parenthesis.addClass('activated');
                this.ui.left_parenthesis.html('[[');
                break;

            case 2:
                this.open_group = 0;
                this.ui.left_parenthesis.removeClass('activated');
                this.ui.left_parenthesis.html('[');
                break;
        }
        this.parent.validParenthesis();
    },

    onCloseGroup: function () {
        switch (this.close_group) {
            case 0:
                this.close_group = 1;
                this.ui.right_parenthesis.addClass('activated');
                this.ui.right_parenthesis.html(']');
                break;

            case 1:
                this.close_group = 2;
                this.ui.right_parenthesis.addClass('activated');
                this.ui.right_parenthesis.html(']]');
                break;

            case 2:
                this.close_group = 0;
                this.ui.right_parenthesis.removeClass('activated');
                this.ui.right_parenthesis.html(']');
                break;
        }
        this.parent.validParenthesis();
    },

    onChangeField: function () {
        var field = this.ui.field.val();
        var column = this.columns[field];

        if (!column) {
            return;
        }

        if (this.widget) {
            this.widget.destroy();
            this.widget = null;
        }

        this.ui.field_value.cleanField();
        this.ui.field_value.empty();

        if (column.format) {
            this.widget = application.descriptor.widgets.newElement(column.format.type);
            if (this.widget) {
                this.widget.create(column.format, this.ui.field_value_group, false, column.group, column.type, {extended_search: false});
            }
        } else {
            var input = $('<input type="text" class="search-value form-control" name="search-value"/>');
            this.ui.field_value_group.append(input);
        }

        this.ui.condition.children('option').remove();

        var operators_labels = {
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

        for (var i = 0; i < column.available_operators.length; i++) {
            var operator_code = column.available_operators[i];
            this.ui.condition.append('<option value="' + operator_code + '">' + operators_labels[operator_code] + '</option>');
        }

        this.ui.condition.selectpicker('refresh');
        if (column.available_operators.includes('eq')) {
            this.ui.condition.selectpicker({container: '.modal'}).selectpicker('val', 'eq');
        } else {
            this.ui.condition.selectpicker({container: '.modal'}).selectpicker('val', column.available_operators[0]);
        }

        this.onConditionChange();
    },

    onRemove: function () {
        if (this.first_element) {
            var new_first_model = this.parent.collection.models[1];
            var new_first_view = this.parent.children.findByModel(new_first_model);

            new_first_view.ui.row_operator.selectpicker('val', 'and');

            new_first_model.set('row_operator', null);
            new_first_view.first_element = true;

            new_first_view.onUIChange();
            new_first_view.$el.find('div.operator').parent().hide();
        }
        this.model.collection.remove(this.model.cid);
        this.parent.validParenthesis();
    },

    onBeforeDetach: function () {
        if (this.widget) {
            this.widget.destroy();
            this.widget = null;
        }
    }
});

module.exports = View;
