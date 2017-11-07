/**
 * @file search.js
 * @brief Entity advanced search dialog
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-05-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ConditionCollection = require('./conditioncollection');
let Dialog = require('../../main/views/dialog');

let View = Dialog.extend({
    template: require('../templates/search.html'),
    templateContext: function () {
        return {
            entity_types: [
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
    },

    onRender: function () {
        View.__super__.onRender.apply(this);

        this.ui.entity_type.selectpicker({}).selectpicker('val', 'accession.accession');
        this.ui.meta_model.selectpicker({});

        this.getRegion('conditions').show(new ConditionCollection({
            collection: application.accession.collections.conditionList,
            parent: this
        }));
        this.onChangeEntityType();

    },

    onAddSearchRow: function () {
        let added_model = application.accession.collections.conditionList.add({
            row_operator: null,
            field: null,
            condition: "eq",
            field_value: null
        });
        const added_view = this.getChildView('conditions').children.findByModel(added_model);
        this.refreshFieldList(added_view);
    },

    onChangeEntityType: function () {
        let entityType = this.ui.entity_type.selectpicker('val');
        this.ui.meta_model.prop('disabled', false);
        let view = this;

        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'meta-model', 'for-describable', entityType]),
            dataType: 'json'
        }).done(function (data) {
            view.ui.meta_model.children('option').remove();

            for (let i = 0; i < data.length; ++i) {
                let opt = $('<option></option>');
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
        let entityType = this.ui.entity_type.selectpicker('val');
        const metaModels = this.ui.meta_model.selectpicker('val');
        let selects = null;

        if (childview) {
            selects = childview.ui.field;
        } else {
            selects = this.getChildView('conditions').ui.field;
        }

        const view = this;

        let descriptorMetaModels = [];

        if (metaModels) {
            for (let i = 0; i < metaModels.length; ++i) {
                descriptorMetaModels.push(parseInt(metaModels[i]));
            }
        }

        application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: entityType, descriptor_meta_models: descriptorMetaModels}

        }).done(function (data) {
            $(selects).children('option').remove().end();

            let columns = data[0].value;

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
            // Accession condition
            const conditions = this.getChildView('conditions').collection.models;
            const query = this.getQuery(conditions);
            const options = {search: query.result};
            application.accession.routers.accession.getAccessionList(options);
            Backbone.history.navigate('app/accession/accession/');

            this.destroy();

        } else if (entityType === 'accession.batch') {
            // Batch condition
            const conditions = this.getChildView('conditions').collection.models;
            const query = this.getQuery(conditions);
            const options = {search: query.result};
            console.log(options);
            application.accession.routers.batch.getBatchList(options);
            Backbone.history.navigate('app/accession/batch/');

            this.destroy();

        }
    },

    setQuery: function () {
        // todo: display a saved query on the UI
    },

    getQuery: function (conditions, condition, parentheses_to_handle) {
        condition = (condition || 0);
        let result = [];
        let i;
        for (i = condition; i < conditions.length; ++i) {
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
                let group = this.getQuery(conditions, i, parentheses_to_handle - 1);
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
        alert(i);
        return {result: result, end_index: i};
    },

    onSave: function () {
        this.getChildView('conditions').children.each(function (view) {
            //todo: Remove this code-block and try to update collection on input (from the childviews)
            view.onUIChange(); //update collection
        });
        const entityType = this.ui.entity_type.val();
        if (entityType === 'accession.accession') {
            let conditions = this.getChildView('conditions').collection.models;
            let query = this.getQuery(conditions);
        }
    },

    onBeforeDestroy: function () {
        this.ui.entity_type.selectpicker('destroy');
        this.ui.meta_model.selectpicker('destroy');

        let rows = this.$el.find('div.search-condition');
        $.each(rows, function (i, el) {
            $(el).find('div.condition').selectpicker('destroy');
        });

        View.__super__.onBeforeDestroy.apply(this);
    }
});

module.exports = View;
