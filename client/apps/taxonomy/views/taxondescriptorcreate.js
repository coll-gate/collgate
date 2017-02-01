/**
 * @file taxondescriptorcreate.js
 * @brief Taxon create descriptor view
 * @author Frederic SCHERMA
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');
var TaxonDescriptorView = require('../views/taxondescriptor');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    template: require('../templates/taxondescriptorcreate.html'),

    ui: {
        defines: 'button.defines'
    },

    events: {
        'click @ui.defines': 'onDefine'
    },

    initialize: function(options) {
    },

    onRender: function() {
    },

    onDefine: function(e) {
        var model = this.model;

        $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/meta-model/for-describable/' + 'taxonomy.taxon/',
            dataType: 'json',
        }).done(function(data) {
            var CreateDescriptorView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_descriptor',
                },
                template: require('../templates/taxondescriptorcreatedialog.html'),
                templateHelpers/*templateContext*/: function () {
                    return {
                        meta_models: data,
                    };
                },

                ui: {
                    validate: "button.continue",
                    meta_model: "#meta_model",
                },

                events: {
                    'click @ui.validate': 'onContinue'
                },

                onRender: function () {
                    CreateDescriptorView.__super__.onRender.apply(this);

                    this.ui.meta_model.selectpicker({});
                },

                onBeforeDestroy: function() {
                    this.ui.meta_model.selectpicker('destroy');

                    CreateDescriptorView.__super__.onBeforeDestroy.apply(this);
                },

                onContinue: function() {
                    var view = this;
                    var model = this.getOption('model');

                    if (this.ui.meta_model.val() != null) {
                        var metaModel = parseInt(this.ui.meta_model.val());

                        view.destroy();

                        // update the descriptor part of the taxon layout
                        var taxonLayout = application.view().getRegion('content').currentView;

                        // patch the taxon descriptor meta model
                        model.save({descriptor_meta_model: metaModel}, {patch: true, wait: false});

                        $.ajax({
                            method: "GET",
                            url: application.baseUrl + 'descriptor/meta-model/' + metaModel + '/layout/',
                            dataType: 'json',
                        }).done(function(data) {
                            var taxonDescriptorView = new TaxonDescriptorView({
                                model: model,
                                descriptorMetaModelLayout: data
                            });
                            taxonLayout.getRegion('descriptors').show(taxonDescriptorView);
                        });
                    }
                }
            });

            var createDescriptorView = new CreateDescriptorView({model: model});
            createDescriptorView.render();
        });
    },

    onShowTab: function() {
        var view = this;

        var DefaultLayout = require('../../main/views/defaultlayout');
        var contextLayout = new DefaultLayout();
        application.getView().getRegion('right').show(contextLayout);

        var actions = [];

        actions.push('add');

        var TaxonDescriptorsContextView = require('../views/taxondescriptorscontext');
        var contextView = new TaxonDescriptorsContextView({actions: actions});

        var TitleView = require('../../main/views/titleview');
        contextLayout.getRegion('title').show(new TitleView({title: gt.gettext("Descriptors")}));
        contextLayout.getRegion('content').show(contextView);

        contextView.on("descriptormetamodel:add", function() {
            view.onDefine();
        });
    }
});

module.exports = View;
