/**
 * @file batchlist.js
 * @brief Batch list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var BatchView = require('../views/batch');
var AdvancedTable = require('../../main/views/advancedtable');
var Dialog = require('../../main/views/dialog');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');
var AccessionModel = require('../models/accession');
var BatchModel = require('../models/batch');
var BatchLayout = require('../views/batchlayout');

var View = AdvancedTable.extend({
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
            var view = this;

            var contextLayout = application.getView().getChildView('right');
            if (!contextLayout) {
                var DefaultLayout = require('../../main/views/defaultlayout');
                contextLayout = new DefaultLayout();
                application.getView().showChildView('right', contextLayout);
            }

            var TitleView = require('../../main/views/titleview');
            contextLayout.showChildView('title', new TitleView({title: _t("Batches actions")}));

            var actions = ['create'];

            var AccessionBatchesContextView = require('./accessionbatchescontext');
            var contextView = new AccessionBatchesContextView({actions: actions});
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
        var accessionModel = null;
        var batchModel = null;

        var metaModelPromise = $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + 'accession.batch/',
            dataType: 'json'
        });

        var accessionModelPromise = null;

        if (this.model instanceof AccessionModel) {
            accessionModel = this.model;
            batchModel = null;
        } else {
            accessionModel = new AccessionModel({id: this.model.get('accession')});
            accessionModelPromise = accessionModel.fetch();

            batchModel = this.model;
        }

        $.when(metaModelPromise, accessionModelPromise).then(function (data) {
            var CreateBatchView = Dialog.extend({
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

                    var accession = this.getOption('accession');
                    var batch = this.getOption('batch');

                    this.ui.code.val(accession.get('name') + ' (' + accession.get('code') + ')');
                    this.ui.meta_model.selectpicker({});
                },

                onBeforeDestroy: function () {
                    this.ui.meta_model.selectpicker('destroy');

                    CreateBatchView.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    var name = this.ui.name.val().trim();

                    if (this.validateName()) {
                        var filters = {
                            method: 'ieq',
                            fields: ['name'],
                            'name': name
                        };

                        $.ajax({
                            type: "GET",
                            url: application.baseUrl + 'accession/batch/search/',
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                            el: this.ui.name,
                            success: function (data) {
                                for (var i in data.items) {
                                    var t = data.items[i];

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
                    var v = this.ui.name.val().trim();

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
                    var valid = this.validateName();

                    if (this.ui.name.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onContinue: function () {
                    var view = this;

                    if (this.validate()) {
                        var name = this.ui.name.val().trim();
                        var metaModel = parseInt(this.ui.meta_model.val());

                        // create a new local model and open an edit view with this model
                        var model = new BatchModel({
                            accession: view.getOption('accession').get('id'),
                            name: name,
                            descriptor_meta_model: metaModel
                        });

                        view.destroy();

                        var defaultLayout = new DefaultLayout();
                        application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Batch"),
                            model: model
                        }));

                        var accessionLayout = new BatchLayout({model: model});
                        defaultLayout.showChildView('content', accessionLayout);
                    }
                }
            });

            var createBatchView = new CreateBatchView({accession: accessionModel, batch: batchModel});
            createBatchView.render();
        });
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
