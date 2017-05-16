/**
 * @file search.js
 * @brief Entity advanced search dialog
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-05-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Dialog = require('../../main/views/dialog');

var View = Dialog.extend({
    tagName: 'div',
    template: require('../templates/search.html'),
    attributes: {
        'id': 'dlg_search'
    },
    templateHelpers/*templateContext*/: function () {
        return {
            entity_types: [
                {id: 'taxonomy.taxon', label: gt.gettext('Cultivar')},
                {id: 'accession.accession', label: gt.gettext('Accession')},
                {id: 'accession.batch', label: gt.gettext('Batch')}
            ],
            meta_models: []
        };
    },

    ui: {
        search: "button.search",
        save: "button.save",
        meta_model: "#meta_model",
        entity_type: "#entity_type"
    },

    events: {
        'click @ui.search': 'onSearch',
        'change @ui.entity_type': 'onChangeEntityType',
        'change @ui.meta_model': 'onChangeMetaModel',
        'click @ui.add': 'onAddSearchRow'
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);
    },

    onRender: function () {
        View.__super__.onRender.apply(this);

        this.ui.entity_type.selectpicker({});
        this.ui.meta_model.selectpicker({});

        // initial row
        this.onAddSearchRow();
    },

    onBeforeDestroy: function() {
        this.ui.entity_type.selectpicker('destroy');
        this.ui.meta_model.selectpicker('destroy');

        var rows = this.$el.find('div.search-condition');
        $.each(rows, function(i, el) {
            $(el).find('div.condition').selectpicker('destroy');
        });

        View.__super__.onBeforeDestroy.apply(this);
    },

    onAddSearchRow: function() {
        var condition = this.$el.find('div.search-condition').find('div.condition').children('div').children('select');

        condition.append('<option value="isnull">' + gt.gettext('Undefined') + '</option>');
        condition.append('<option value="notnull">' + gt.gettext('Defined') + '</option>');
        condition.append('<option value="icontains">' + gt.gettext('Contient') + '</option>');
        condition.append('<option value="eq">' + gt.gettext('Exact') + '</option>');
        condition.append('<option value="neq">' + gt.gettext('Different') + '</option>');
        condition.append('<option value="lte">' + gt.gettext('Lesser than') + '</option>');
        condition.append('<option value="gte">' + gt.gettext('Greater than') + '</option>');

        condition.selectpicker({}).selectpicker('val', 'eq').on('change', $.proxy(this.onChangeCondition, this));

        this.onChangeEntityType();
    },

    onChangeCondition: function(e) {
        var condition = $(e.currentTarget);
        var value = condition.closest('div.search-condition').find('div.value div');

        if (condition.val() === "isnull" || condition.val() === "notnull") {
            value.hide(false);
        } else {
            value.show(false);
        }
    },

    onChangeEntityType: function() {
        var entityType = this.ui.entity_type.val();
        var view = this;

        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + entityType + '/',
            dataType: 'json'
        }).done(function(data) {
            view.ui.meta_model.children('option').remove();

            for (var i = 0; i < data.length; ++i) {
                var opt = $('<option></option>');
                opt.attr('value', data[i].id);
                opt.html(data[i].label);

                view.ui.meta_model.append(opt);
            }

            view.ui.meta_model.selectpicker('refresh');
        });
    },

    onChangeMetaModel: function() {
        alert("@todo");
    },

    onSearch: function() {
        var filters = {};

        var rows = this.$el.find('div.search-condition');
        $.each(rows, function(i, el) {

        });



        this.destroy();
    }
});

module.exports = View;
