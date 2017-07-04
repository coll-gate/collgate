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
var ScrollView = require('../../main/views/scroll');
var Dialog = require('../../main/views/dialog');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');
var AccessionModel = require('../models/accession');
var BatchModel = require('../models/batch');
var BatchLayout = require('../views/batchlayout');

var View = ScrollView.extend({
    template: require("../templates/batchlist.html"),
    className: "batch-list advanced-table-container",
    childView: BatchView,
    childViewContainer: 'tbody.batch-list',

    userSettingName: function() {
        if (this.collection.batch_type === 'parents') {
            return 'parents_batches_list_columns';
        } else if (this.collection.batch_type === 'children') {
            return 'children_batches_list_columns';
        } else {
            return 'batches_list_columns';
        }
    },

    defaultColumns: [
        {name: 'glyph', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
    ],

    columnsOptions: {
        'glyph': {label: '', width: 'auto', glyphicon: ['glyphicon-unchecked', 'glyphicon-unchecked'], event: 'selectBatch', fixed: true},
        'name': {label: gt.gettext('Name'), width: 'auto', minWidth: true, event: 'viewDetails'},
    },

    templateHelpers/*templateContext*/: function () {
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

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        // this.listenTo(this.collection, 'reset', this.render, this);
    },

    onShowTab: function() {
        View.__super__.onShowTab.apply(this);

        // context only for children (sub-batches)
        if (this.collection.batch_type !== 'parents') {
            var view = this;

            var contextLayout = application.getView().getRegion('right').currentView;
            if (!contextLayout) {
                var DefaultLayout = require('../../main/views/defaultlayout');
                contextLayout = new DefaultLayout();
                application.getView().getRegion('right').show(contextLayout);
            }

            var TitleView = require('../../main/views/titleview');
            contextLayout.getRegion('title').show(new TitleView({title: gt.gettext("Batches actions")}));

            var actions = ['create'];

            var AccessionBatchesContextView = require('./accessionbatchescontext');
            var contextView = new AccessionBatchesContextView({actions: actions});
            contextLayout.getRegion('content').show(contextView);

            contextView.on("batch:create", function () {
                view.onCreate();
            });
        }
    },

    onHideTab: function() {
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

        $.when(metaModelPromise, accessionModelPromise).done(function (data) {
            var CreateBatchView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_batch'
                },
                template: require('../templates/batchcreate.html'),
                templateHelpers/*templateContext*/: function () {
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
                                        $(this.el).validateField('failed', gt.gettext('Batch name already in usage'));
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
                        $(this.ui.name).validateField('failed', gt.gettext("128 characters max"));
                        return false;
                    } else if (v.length < 3) {
                        $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
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
                        application.show(defaultLayout);

                        defaultLayout.getRegion('title').show(new TitleView({
                            title: gt.gettext("Batch"),
                            model: model
                        }));

                        var accessionLayout = new BatchLayout({model: model});
                        defaultLayout.getRegion('content').show(accessionLayout);
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
