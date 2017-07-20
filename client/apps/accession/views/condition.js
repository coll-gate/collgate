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
        'change @ui.condition': 'onUIChange',
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
        this.open_group = false;
        this.close_group = false;
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

        var condition = this.$el.find('div.search-condition').find('div.condition').children('div').children('select');
        condition.append('<option value="isnull">' + gt.gettext('Undefined') + '</option>');
        condition.append('<option value="notnull">' + gt.gettext('Defined') + '</option>');
        condition.append('<option value="icontains">' + gt.gettext('Contains') + '</option>');
        condition.append('<option value="eq">' + gt.gettext('Exact') + ' =' + '</option>');
        condition.append('<option value="neq">' + gt.gettext('Different from') + ' <>' + '</option>');
        condition.append('<option value="lte">' + gt.gettext('Lesser than') + ' <=' + '</option>');
        condition.append('<option value="gte">' + gt.gettext('Greater than') + ' >=' + '</option>');
        condition.selectpicker({container: 'body'}).selectpicker('val', 'eq');

        // this.ui.field.selectpicker({});

        this.ui.field.val(this.model.get('field'));
        this.ui.condition.val(this.model.get('condition'));
        this.ui.field_value.val(this.model.get('field_value'));
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
        this.open_group = !this.open_group;
        if (this.open_group) {
            this.ui.left_parenthesis.addClass('activated');
        } else {
            this.ui.left_parenthesis.removeClass('activated');
        }

        this.parent.validParenthesis();

    },

    onCloseGroup: function () {
        this.close_group = !this.close_group;
        if (this.close_group) {
            this.ui.right_parenthesis.addClass('activated');
        } else {
            this.ui.right_parenthesis.removeClass('activated');
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
                this.widget.create(column.format, this.ui.field_value_group, false, column.group, column.type);
            }
        } else {
            var input = $('<input type="text" class="search-value form-control" name="search-value"/>');
            this.ui.field_value_group.append(input);
        }
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
