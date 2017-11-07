/**
 * @file batchpanel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-06
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Dialog = require('../../main/views/dialog');
let Marionette = require('backbone.marionette');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let BatchPanelModel = require('../models/batchpanel');
let BatchPanelLayout = require('../views/batch/panel/panellayout');

let Controller = Marionette.Object.extend({
    delete: function (model) {
        let DeletePanelDialog = Dialog.extend({
            template: require('../../main/templates/confirm.html'),
            templateContext: function () {
                return {
                    title: _t("Delete panel"),
                    message: _t("Do you really want to delete this panel?"),
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


        let CreatePanelDialog = Dialog.extend({
            template: require('../templates/panelcreate.html'),
            ui: {
                validate: "button.create",
                name: "#panel_name",
                descriptor_meta_model: "#meta_model"
            },

            events: {
                'click @ui.validate': 'onCreate',
                'input @ui.name': 'onNameInput'
            },

            initialize: function (options) {
                CreatePanelDialog.__super__.initialize.apply(this);
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
                        url: window.application.url(['accession', 'batchpanel', 'search']),
                        dataType: 'json',
                        data: {filters: JSON.stringify(filters)},
                        el: this.ui.name,
                        success: function (data) {
                            if (data.items.length > 0) {
                                for (let i in data.items) {
                                    let panel = data.items[i];

                                    if (panel.name.toUpperCase() === name.toUpperCase()) {
                                        $(this.el).validateField('failed', _t('Batch panel name already in usage'));
                                        break;
                                    }
                                }
                            } else {
                                $(this.el).validateField('ok');
                            }
                        }
                    });
                }
            },

            validateName: function () {
                let v = this.ui.name.val().trim();

                if (v.length > 128) {
                    this.ui.name.validateField('failed', _t('characters_max', {count: 128}));
                    return false;
                } else if (v.length < 3) {
                    this.ui.name.validateField('failed', _t('characters_min', {count: 3}));
                    return false;
                }

                return true;
            },

            onCreate: function () {
                let view = this;

                if (this.ui.name.isValidField()) {
                    let name = this.ui.name.val().trim();

                    // create a new local model and open an edit view with this model
                    let model = new BatchPanelModel({
                        name: name,
                        selection: {
                            select: selection,
                            from: related_entity,
                            filters: filters,
                            search: search
                        },
                        descriptors: {},
                        descriptor_meta_model: null
                    });

                    view.destroy();

                    let defaultLayout = new DefaultLayout();
                    application.main.showContent(defaultLayout);

                    defaultLayout.showChildView('title', new TitleView({
                        title: _t("Panel"),
                        model: model
                    }));

                    let accessionPanelLayout = new BatchPanelLayout({model: model});
                    defaultLayout.showChildView('content', accessionPanelLayout);
                }
            }
        });

        let createPanelDialog = new CreatePanelDialog();
        createPanelDialog.render();
    },

    linkBatches: function (selection, related_entity, filters, search, collection) {
        related_entity || (related_entity = null);
        filters || (filters = {});
        search || (search = {});

        if (!selection) {
            $.alert.warning(_t("No batch selected"));
            return;
        }

        $.ajax({
            type: "GET",
            url: window.application.url(['accession', 'batchpanel']),
            dataType: 'json'
        }).done(function (data) {
            let LinkToPanelDialog = Dialog.extend({
                template: require('../templates/panellinkbatches.html'),
                templateContext: function () {
                    return {
                        panels: data.items
                    };
                },
                ui: {
                    validate: "button.link-to-panel",
                    panel: "#panel"
                },

                events: {
                    'click @ui.validate': 'onLinkToPanel'
                },

                initialize: function (options) {
                    LinkToPanelDialog.__super__.initialize.apply(this);
                },

                onRender: function () {
                    LinkToPanelDialog.__super__.onRender.apply(this);
                    this.ui.panel.selectpicker({});
                },

                onLinkToPanel: function (ev) {
                    let view = this;
                    let panel_id = this.ui.panel.val();
                    let go_to_panel = $(ev.currentTarget).data('gotopanel');

                    $.ajax({
                        type: 'PATCH',
                        url: window.application.url(['accession', 'batchpanel', panel_id, 'batches']),
                        dataType: 'json',
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({
                            'action': 'add',
                            'selection': {
                                'select': selection,
                                'from': related_entity,
                                'filters': filters,
                                'search': search
                            }
                        })
                    }).done(function () {
                        if (collection) {
                           collection.fetch();
                        }
                        view.destroy();
                        if (go_to_panel) {
                            Backbone.history.navigate('app/accession/batchpanel/' + panel_id + '/batches/', {trigger: true});
                        }
                    });
                }
            });

            let linkToPanelDialog = new LinkToPanelDialog();
            linkToPanelDialog.render();
        });
    }

});

module.exports = Controller;