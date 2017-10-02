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
                {id: 'classification.classificationEntry', label: _t('Cultivar')},
                {id: 'accession.accession', label: _t('Accession')},
                {id: 'accession.batch', label: _t('Batch')}
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
        this.ui.meta_model.prop('disabled', false);
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

            if (data.length === 1) {
                view.ui.meta_model.selectpicker('val', view.ui.meta_model.children("option:first").val());
                view.ui.meta_model.prop('disabled', true)
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
            // selects = childview.$el.find('div.search-condition').find('div.field').children('div').children('select');
            selects = childview.ui.field;
        } else {
            // selects = this.getChildView('conditions').$el.find('div.search-condition').find('div.field').children('div').children('select');
            selects = this.getChildView('conditions').ui.field;
        }

        const view = this;

        var descriptorMetaModels = [];

        if (metaModels) {
            for (var i = 0; i < metaModels.length; ++i) {
                descriptorMetaModels.push(parseInt(metaModels[i]));
            }
        }

        application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: entityType, descriptor_meta_models: descriptorMetaModels},
        }).done(function(data) {
            $(selects).children('option').remove().end();

            // var columns_extension = {
            //     'code': {label: _t('Code'), format: {type: 'string'}},
            //     'name': {label: _t('Name'), format: {type: 'string'}}
            //     // 'parent': {
            //     //     label: _t('Classification'),
            //     //     width: 'auto',
            //     //     minWidth: true,
            //     //     event: 'view-parent-details',
            //     //     custom: 'parentCell',
            //     //     field: 'name'
            //     // },
            //     // 'descriptor_meta_model': {label: _t('Model'), width: 'auto', minWidth: true}
            // };

            var columns = data[0].value;
            // for(var col in columns_extension) columns[col]=columns_extension[col]; // add columns_extension properties in the same object "columns"

            view.getChildView('conditions').children.each(function (childview) {
                childview.columns = columns;
            });

            $.each(columns, function (field) {
                selects.append($('<option>', {
                    value: field,
                    text: columns[field].label,
                    'data-type': columns[field].format.type
                }));
            });

            selects.trigger('change')
                .selectpicker('refresh');
        });
/*        var models_data = {};
        if (metaModels !== null) {
            models_data = {meta_model_list: metaModels.toString()}
        }

        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/' + entityType + '/',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: models_data
        }).done(function (data) {
            $(selects).children('option').remove().end();

            // var columns_extension = {
            //     'code': {label: _t('Code'), format: {type: 'string'}},
            //     'name': {label: _t('Name'), format: {type: 'string'}}
            //     // 'parent': {
            //     //     label: _t('Classification'),
            //     //     width: 'auto',
            //     //     minWidth: true,
            //     //     event: 'view-parent-details',
            //     //     custom: 'parentCell',
            //     //     field: 'name'
            //     // },
            //     // 'descriptor_meta_model': {label: _t('Model'), width: 'auto', minWidth: true}
            // };
            //
            var columns = data.columns;
            // for(var col in columns_extension) columns[col]=columns_extension[col]; // add columns_extension properties in the same object "columns"

            view.getChildView('conditions').children.each(function (childview) {
                childview.columns = columns;
            });

            $.each(columns, function (field) {
                selects.append($('<option>', {
                    value: field,
                    text: columns[field].label,
                    'data-type': columns[field].format.type
                }));
            });
            selects.trigger('change');
            selects.selectpicker('refresh');
        });*/
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
            const conditions = this.getChildView('conditions').collection.models;
            const query = this.getQuery(conditions);
            const options = {search: query.result};
            console.log(options);
            application.accession.routers.batch.getBatchList(options);

            this.destroy();

        } else if (entityType === 'classification.classificationEntry') {
            // todo
            alert('Not yet implemented!')
        }
        // this.destroy();
    },

    setQuery: function () {
        // todo: display a saved query on the UI
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
            // console.log(query.result);
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
