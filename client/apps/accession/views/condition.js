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
        operator.append('<option value="and">' + gt.gettext('AND') + '</option>');
        operator.append('<option value="or">' + gt.gettext('OR') + '</option>');
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

        console.log(column);
        console.log(this.widget);
        if (this.widget.allow_multiple) {
            this.widget.destroy();

            if (this.ui.condition.val() === 'in' || this.ui.condition.val() === 'notin') {
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
            if (this.ui.condition.val() === 'in' || this.ui.condition.val() === 'notin') {
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

        var field = this.ui.field.val();
        var column = this.columns[field];

        console.log(column.format);
        console.log(this.widget);
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
        var field_type = this.ui.field[0].selectedOptions[0].dataset.type;

        var options_set = null;

        if (column.format.list_type === "dropdown" || column.format.list_type === "autocomplete" || ['entity', 'descriptor_meta_model', 'country', 'city'].includes(field_type)) {
            options_set = 2;
        } else if (['numeric_range'].includes(field_type)) {
            options_set = 1;
        } else if (field_type === 'string') {
            options_set = 3;
        }

        switch (options_set) {
            case 1:
                this.ui.condition.append('<option value="isnull">' + gt.gettext('Undefined') + '</option>');
                this.ui.condition.append('<option value="notnull">' + gt.gettext('Defined') + '</option>');
                this.ui.condition.append('<option value="eq">' + gt.gettext('Exact') + ' =' + '</option>');
                this.ui.condition.append('<option value="neq">' + gt.gettext('Different from') + ' <>' + '</option>');
                this.ui.condition.append('<option value="lte">' + gt.gettext('Lesser than') + ' <=' + '</option>');
                this.ui.condition.append('<option value="gte">' + gt.gettext('Greater than') + ' >=' + '</option>');
                break;

            case 2:
                this.ui.condition.append('<option value="isnull">' + gt.gettext('Undefined') + '</option>');
                this.ui.condition.append('<option value="notnull">' + gt.gettext('Defined') + '</option>');
                this.ui.condition.append('<option value="eq">' + gt.gettext('Exact') + ' =' + '</option>');
                this.ui.condition.append('<option value="neq">' + gt.gettext('Different from') + ' <>' + '</option>');
                this.ui.condition.append('<option value="in">' + gt.gettext('Include') + '</option>');
                this.ui.condition.append('<option value="notin">' + gt.gettext('Not include') + '</option>');
                break;

            case 3:
                this.ui.condition.append('<option value="isnull">' + gt.gettext('Undefined') + '</option>');
                this.ui.condition.append('<option value="notnull">' + gt.gettext('Defined') + '</option>');
                this.ui.condition.append('<option value="eq">' + gt.gettext('Exact') + ' =' + '</option>');
                this.ui.condition.append('<option value="neq">' + gt.gettext('Different from') + ' <>' + '</option>');
                this.ui.condition.append('<option value="icontains">' + gt.gettext('Contains') + '</option>');
                break;

            default:
                this.ui.condition.append('<option value="isnull">' + gt.gettext('Undefined') + '</option>');
                this.ui.condition.append('<option value="notnull">' + gt.gettext('Defined') + '</option>');
                this.ui.condition.append('<option value="eq">' + gt.gettext('Exact') + ' =' + '</option>');
                this.ui.condition.append('<option value="neq">' + gt.gettext('Different from') + ' <>' + '</option>');
                break;
        }

        this.ui.condition.selectpicker('refresh');
        this.ui.condition.selectpicker({container: '.modal'}).selectpicker('val', 'eq');

        this.onUIChange();
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
    }
});

module.exports = View;