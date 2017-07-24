/**
 * @file search.js
 * @brief Entity advanced search dialog
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-05-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var ConditionCollection = require('./conditioncollection');
var Dialog = require('../../main/views/dialog');

var View = Dialog.extend({
    template: require('../templates/search.html'),
    templateContext: function () {
        return {
            entity_types: [
                {id: 'classification.taxon', label: gt.gettext('Cultivar')},
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
        entity_type: "#entity_type",
        add: "span.action.add",
        error_msg: '#error-msg'
    },

    events: {
        'click @ui.search': 'onSearch',
        'change @ui.entity_type': 'onChangeEntityType',
        'change @ui.meta_model': 'onChangeMetaModel',
        'click @ui.add': 'onAddSearchRow',
        'click @ui.save': 'onSave'
    },

    regions: {
        'conditions': '#conditions_part'
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);
        // this.search = application.accession.search;
        // this.search.entity = 'accession.accession';
    },

    onRender: function () {
        View.__super__.onRender.apply(this);

        this.ui.entity_type.selectpicker({}).selectpicker('val', 'accession.accession');
        this.ui.meta_model.selectpicker({});

        this.getRegion('conditions').show(new ConditionCollection({
            collection: application.accession.collections.conditionList,
            parent: this
        }));

        // if (this.search.entity) {
        //     this.ui.entity_type.selectpicker('val', this.search.entity);
        this.onChangeEntityType();
        // }
        //
        // if (this.search.models) {
        //     this.ui.entity_type.selectpicker('val', this.search.models);
        //     this.onChangeMetaModel();
        // }
    },

    onAddSearchRow: function () {
        var added_model = application.accession.collections.conditionList.add({
            row_operator: null,
            field: null,
            condition: "eq",
            field_value: null
        });
        const added_view = this.getChildView('conditions').children.findByModel(added_model);
        this.refreshFieldList(added_view);
    },

    onChangeEntityType: function () {
        var entityType = this.ui.entity_type.selectpicker('val');
        // this.search.entity = entityType;
        var view = this;

        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + entityType + '/',
            dataType: 'json'
        }).done(function (data) {
            view.ui.meta_model.children('option').remove();

            for (var i = 0; i < data.length; ++i) {
                var opt = $('<option></option>');
                opt.attr('value', data[i].id);
                opt.html(data[i].label);

                view.ui.meta_model.append(opt);
            }
            view.ui.meta_model.selectpicker('refresh');

            application.accession.collections.conditionList = new Backbone.Collection();
            view.getRegion('conditions').show(new ConditionCollection({
                collection: application.accession.collections.conditionList,
                parent: this
            }));
            view.onAddSearchRow();
        });
    },

    onChangeMetaModel: function () {
        application.accession.collections.conditionList = new Backbone.Collection();
        this.getRegion('conditions').show(new ConditionCollection({
            collection: application.accession.collections.conditionList,
            parent: this
        }));
        this.onAddSearchRow();
    },

    refreshFieldList: function (childview) {
        const entityType = this.ui.entity_type.selectpicker('val');
        const metaModels = this.ui.meta_model.selectpicker('val');
        var selects = null;

        if (childview) {
            selects = childview.$el.find('div.search-condition').find('div.field').children('div').children('select');
        } else {
            selects = this.getChildView('conditions').$el.find('div.search-condition').find('div.field').children('div').children('select');
        }

        const view = this;

        var models_data = {};
        if (metaModels !== null) {
            models_data = {meta_model_list: metaModels.toString()}
        }

        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/' + entityType + '/',
            dataType: 'json',
            data: models_data
        }).done(function (data) {
            view.getChildView('conditions').children.each(function (childview) {
                childview.columns = data.columns;
            });

            $(selects).children('option').remove().end();

            $.each(data.columns, function (field) {
                selects.append($('<option>', {
                    value: field,
                    text: data.columns[field].label,
                    'data-type': data.columns[field].format.type
                }));
            });
            selects.trigger('change');
        });
        selects.change();
    },

    onSearch: function () {

        this.getChildView('conditions').children.each(function (view) {
            //todo: Remove this code-block and try to update collection on input (from the childviews)
            view.onUIChange(); //update collection
        });

        if (!this.getChildView('conditions').validParenthesis()) {
            return
        }

        const entityType = this.ui.entity_type.val();

        if (entityType === 'accession.accession') {
            const conditions = this.getChildView('conditions').collection.models;
            const query = this.getQuery(conditions);
            const options = {search: query.result};
            application.accession.routers.accession.getAccessionList(options);

            this.destroy();

        } else if (entityType === 'accession.batch') {
            // todo
            alert('Not yet implemented!')
        } else if (entityType === 'classification.taxon') {
            // todo
            alert('Not yet implemented!')
        }
        // this.destroy();
    },

    getQuery: function (conditions, condition, parentheses_to_handle) {
        condition = (condition || 0);
        var result = [];
        for (var i = condition; i < conditions.length; ++i) {
            if (typeof parentheses_to_handle === 'undefined') {
                parentheses_to_handle = conditions[i].attributes.open_group;
            }
            // remove some useless parentheses
            if ((conditions[i].attributes.open_group === 2 && conditions[i].attributes.close_group !== 0)
                || (conditions[i].attributes.open_group === 1 && conditions[i].attributes.close_group === 2)) {
                conditions[i].attributes.close_group--;
                conditions[i].attributes.open_group--;
            }
            if ((conditions[i].attributes.open_group === 2 && conditions[i].attributes.close_group === 2)
                || (conditions[i].attributes.open_group === 1 && conditions[i].attributes.close_group === 1)) {
                conditions[i].attributes.close_group = 0;
                conditions[i].attributes.open_group = 0;
            }
            // add operator
            if (conditions[i].attributes.row_operator !== null && (parentheses_to_handle === conditions[i].attributes.open_group || parentheses_to_handle > 0 && conditions[i].attributes.open_group !== 2)) {
                result.push({
                    'type': 'op',
                    'value': conditions[i].attributes.row_operator
                });
            }
            // add conditions group
            if (conditions[i].attributes.open_group && parentheses_to_handle !== 0) {
                var group = this.getQuery(conditions, i, parentheses_to_handle - 1);
                result.push(group.result);
                i = (group.end_index || i);

                if (conditions[i].attributes.close_group === 2 && parentheses_to_handle - 1 === 0) {
                    return {result: result, end_index: i};
                }
            } else {
                //add field condition
                result.push({
                    'type': 'term',
                    'field': conditions[i].attributes.field,
                    'value': conditions[i].attributes.field_value,
                    'op': conditions[i].attributes.condition
                });

                if (i + 1 < conditions.length && conditions[i + 1].attributes.open_group) {
                    parentheses_to_handle = conditions[i + 1].attributes.open_group;
                }

                if (conditions[i].attributes.close_group) {
                    return {result: result, end_index: i};
                }
            }
        }
        return {result: result, end_index: i};
    },

    onSave: function () {
        this.getChildView('conditions').children.each(function (view) {
            //todo: Remove this code-block and try to update collection on input (from the childviews)
            view.onUIChange(); //update collection
        });
        const entityType = this.ui.entity_type.val();
        if (entityType === 'accession.accession') {
            var conditions = this.getChildView('conditions').collection.models;
            var query = this.getQuery(conditions);
            console.log(query.result);
        }
    },

    onBeforeDestroy: function () {
        this.ui.entity_type.selectpicker('destroy');
        this.ui.meta_model.selectpicker('destroy');

        var rows = this.$el.find('div.search-condition');
        $.each(rows, function (i, el) {
            $(el).find('div.condition').selectpicker('destroy');
        });

        View.__super__.onBeforeDestroy.apply(this);
    }
});

module.exports = View;
