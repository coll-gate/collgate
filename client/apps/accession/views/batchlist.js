/**
 * @file batchlist.js
 * @brief Batch list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchView = require('../views/batch');
let AdvancedTable = require('../../main/views/advancedtable');
let Dialog = require('../../main/views/dialog');
let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');
let AccessionModel = require('../models/accession');
let BatchModel = require('../models/batch');
let BatchLayout = require('../views/batchlayout');

let View = AdvancedTable.extend({
    template: require("../../descriptor/templates/entitylist.html"),
    className: "batch-list advanced-table-container",
    childView: BatchView,
    childViewContainer: 'tbody.entity-list',
    userSettingVersion: '1.0',

    userSettingName: function () {
        if (this.collection.batch_type === 'parents') {
            return 'parents_batches_list_columns';
        } else if (this.collection.batch_type === 'children') {
            return 'children_batches_list_columns';
        } else {
            return 'batches_list_columns';
        }
    },

    defaultColumns: [
        {name: 'select', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
    ],

    columnsOptions: {
        'select': {
            label: '',
            width: 'auto',
            type: 'checkbox',
            glyphicon: ['fa-square-o', 'fa-square-o'],
            event: 'selectBatch',
            fixed: true
        },
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-batch-details'},
    },

    templateContext: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    childViewOptions: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        // this.listenTo(this.collection, 'reset', this.render, this);
    },

    onShowTab: function () {
        View.__super__.onShowTab.apply(this);

        // context only for children (sub-batches)
        if (this.collection.batch_type !== 'parents') {
            let view = this;

            let contextLayout = application.getView().getChildView('right');
            if (!contextLayout) {
                let DefaultLayout = require('../../main/views/defaultlayout');
                contextLayout = new DefaultLayout();
                application.getView().showChildView('right', contextLayout);
            }

            let TitleView = require('../../main/views/titleview');
            contextLayout.showChildView('title', new TitleView({title: _t("Batches actions")}));

            let actions = ['create'];

            let AccessionBatchesContextView = require('./accessionbatchescontext');
            let contextView = new AccessionBatchesContextView({actions: actions});
            contextLayout.showChildView('content', contextView);

            contextView.on("batch:create", function () {
                view.onCreate();
            });
        }
    },

    onHideTab: function () {
        application.main.defaultRightView();
    },

    onCreate: function () {
        let accessionModel = null;
        let batchModel = null;

        let metaModelPromise = $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'meta-model', 'for-describable', 'accession.batch/']),
            dataType: 'json'
        });

        let accessionModelPromise = null;

        if (this.model instanceof AccessionModel) {
            accessionModel = this.model;
            batchModel = null;
        } else {
            accessionModel = new AccessionModel({id: this.model.get('accession')});
            accessionModelPromise = accessionModel.fetch();

            batchModel = this.model;
        }

        $.when(metaModelPromise, accessionModelPromise).then(function (data) {
            let CreateBatchView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_batch'
                },
                template: require('../templates/batchcreate.html'),
                templateContext: function () {
                    return {
                        meta_models: data[0]
                    };
                },

                ui: {
                    validate: "button.continue",
                    code: "#accession_code",
                    name: "#batch_name",
                    meta_model: "#meta_model"
                },

                events: {
                    'click @ui.validate': 'onContinue',
                    'input @ui.name': 'onNameInput'
                },

                onRender: function () {
                    CreateBatchView.__super__.onRender.apply(this);

                    let accession = this.getOption('accession');
                    let batch = this.getOption('batch');

                    this.ui.code.val(accession.get('name') + ' (' + accession.get('code') + ')');
                    this.ui.meta_model.selectpicker({});
                },

                onBeforeDestroy: function () {
                    this.ui.meta_model.selectpicker('destroy');

                    CreateBatchView.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    let name = this.ui.name.val().trim();

                    if (this.validateName()) {
                        let filters = {
                            method: 'ieq',
                            fields: ['name'],
                            'name': name
                        };

                        $.ajax({
                            type: "GET",
                            url: window.application.url(['accession', 'batch', 'search']),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name,
                            success: function (data) {
                                for (let i in data.items) {
                                    let t = data.items[i];

                                    if (t.label.toUpperCase() === name.toUpperCase()) {
                                        $(this.el).validateField('failed', _t('Batch name already in usage'));
                                        return;
                                    }
                                }

                                $(this.el).validateField('ok');
                            }
                        });
                    }
                },

                validateName: function () {
                    let v = this.ui.name.val().trim();

                    if (v.length > 128) {
                        $(this.ui.name).validateField('failed', _t('characters_max', {count: 128}));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
                        return false;
                    }

                    return true;
                },

                validate: function () {
                    let valid = this.validateName();

                    if (this.ui.name.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onContinue: function () {
                    let view = this;

                    if (this.validate()) {
                        let name = this.ui.name.val().trim();
                        let metaModel = parseInt(this.ui.meta_model.val());

                        // create a new local model and open an edit view with this model
                        let model = new BatchModel({
                            accession: view.getOption('accession').get('id'),
                            name: name,
                            descriptor_meta_model: metaModel
                        });

                        view.destroy();

                        let defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Batch"),
                            model: model
                        }));

                        let accessionLayout = new BatchLayout({model: model});
                        defaultLayout.showChildView('content', accessionLayout);
                    }
                }
            });

            let createBatchView = new CreateBatchView({accession: accessionModel, batch: batchModel});
            createBatchView.render();
        });
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
