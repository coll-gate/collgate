/**
 * @file batch.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-06-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let BatchModel = require('../models/batch');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');
let Search = require('../../main/utils/search');

let BatchLayout = require('../views/batch/batchlayout');
let SearchEntityDialog = require('../views/search');

let Controller = Marionette.Object.extend({
    destroy: function (model) {
        let DeletePanelDialog = Dialog.extend({
            template: require('../../main/templates/confirm.html'),
            templateContext: function () {
                return {
                    title: _t("Delete batch"),
                    message: _t("Do you really want to delete this batch?"),
                    confirm_txt: _("Yes"),
                    confirm_class: 'danger',
                    cancel_txt: _("No"),
                    cancel_class: 'default'
                }
            },
            ui: {
                confirm: "button.confirm"
            },
            events: {
                'click @ui.confirm': 'onDelete'
            },

            initialize: function () {
                DeletePanelDialog.__super__.initialize.apply(this);
            },

            onDelete: function () {
                model.destroy({wait: true});
                this.destroy();
                return false;
            }

        });

        let deletePanelDialog = new DeletePanelDialog();
        deletePanelDialog.render();
    },

    create: function (selection, related_entity, filters, search) {
        selection || (selection = false);
        related_entity || (related_entity = null);
        filters || (filters = {});
        search || (search = {});

        let layouts = $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'layout', 'for-describable', 'accession.batch']),
            dataType: 'json'
        });

        layouts.then(function (data) {
            let CreateBatchView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_batch'
                },
                template: require('../templates/navbatchcreate.html'),
                templateContext: function () {
                    return {
                        layouts: data,
                        title: (!selection) ? _t("Introduce a batch") : _t("Introduce a sub-batch"),
                    };
                },

                ui: {
                    validate: "button.continue",
                    layout: "#layout",
                    accession: "#accession"
                },

                events: {
                    'click @ui.validate': 'onContinue',
                    'change @ui.accession': 'validateAccession'
                },

                regions: {
                    'namingOptions': 'div.naming-options'
                },

                onRender: function () {
                    CreateBatchView.__super__.onRender.apply(this);

                    window.application.main.views.languages.drawSelect(this.ui.language);
                    this.ui.layout.selectpicker({});

                    this.ui.accession.select2(Search(
                        this.ui.accession.parent(),
                        window.application.url(['accession', 'accession', 'search']),
                        function (params) {
                            return {
                                method: 'icontains',
                                fields: ['name'],
                                'name': params.term.trim()
                            };
                        }, {
                            placeholder: _t("Enter a accession name. 3 characters at least for auto-completion")
                        })
                    );

                    // naming options
                    let self = this;

                    $.ajax({
                        type: "GET",
                        url: window.application.url(['accession', 'naming', 'batch']),
                        dataType: 'json',
                    }).done(function(data) {
                        let NamingOptionsView = require('../views/namingoption');
                        let len = (data.format.match(/{CONST}/g) || []).length;

                        let namingOptions = new Array(len);

                        self.showChildView("namingOptions", new NamingOptionsView({
                            namingFormat: data.format,
                            namingOptions: namingOptions
                        }));
                    });
                },

                onBeforeDestroy: function () {
                    this.ui.layout.selectpicker('destroy');
                    this.ui.accession.select2('destroy');

                    CreateBatchView.__super__.onBeforeDestroy.apply(this);
                },

                validateAccession: function () {
                    let accessionId = 0;

                    if (this.ui.accession.val())
                        accessionId = parseInt(this.ui.accession.val());

                    if (accessionId === 0 || isNaN(accessionId)) {
                        $(this.ui.accession).validateField('failed', _t('The accession must be defined'));
                        return false;
                    } else {
                        $(this.ui.accession).validateField('ok');
                        return true;
                    }
                },

                validate: function () {
                    let valid_accession = this.validateAccession();
                    return valid_accession;
                },

                onContinue: function () {
                    let self = this;

                    if (this.validate()) {
                        let namingOptions = this.getChildView('namingOptions').getNamingOptions();
                        let accession = parseInt(this.ui.accession.val());
                        let layout = parseInt(this.ui.layout.val());

                        // create a new local model and open an edit view with this model
                        let model = new BatchModel({
                            naming_options: namingOptions,
                            accession: accession,
                            layout: layout,
                            selection: {
                                select: selection,
                                from: related_entity,
                                filters: filters,
                                search: search
                            },
                        });

                        self.destroy();

                        let defaultLayout = new DefaultLayout();
                        window.application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Batch"),
                            model: model
                        }));

                        let batchLayout = new BatchLayout({model: model});
                        defaultLayout.showChildView('content', batchLayout);
                    }
                }
            });

            let createBatchView = new CreateBatchView();
            createBatchView.render();
        });
    },

    unlinkBatches: function (view) {
        if (!view.getSelection('select')) {
            $.alert.warning(_t("No batch selected"));
            return;
        }

        $.ajax({
                type: 'PATCH',
                url: window.application.url(['accession', 'batch', view.model.id, 'batch']),
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    'action': 'remove',
                    'selection': {
                        'select': view.getSelection('select'),
                        'from': {
                            'content_type': 'accession.batch',
                            'id': view.model.id
                        },
                        'filters': view.collection.filters
                        // 'search': search
                    }
                })
            }
        ).done(function () {
            if (view.getSelection('select').op === 'in') {
                // this condition by pass auto-request loop to retrieve last user position in the table
                view.collection.remove(view.getSelection('select').value);
            } else {
                view.collection.fetch();
            }
            view.collection.count();
        });
    },

    search: function () {
        let searchEntityDialog = new SearchEntityDialog({entity: 'accession.batch'});
        searchEntityDialog.render();
    }
});

module.exports = Controller;
