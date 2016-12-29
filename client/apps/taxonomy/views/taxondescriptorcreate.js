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
        'click @ui.defines': 'onDefines',
    },

    initialize: function(options) {
    },

    onRender: function() {
    },

    onDefines: function(e) {
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
                templateHelpers: function () {
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
                    CreateDescriptorView.__super__.onBeforeDestroy.apply(this);

                    this.ui.meta_model.selectpicker('destroy');
                },

                onContinue: function() {
                    var view = this;
                    var model = this.getOption('model');

                    if (this.ui.meta_model.val() != null) {
                        var metaModel = parseInt(this.ui.meta_model.val());

                        view.remove();

                        // update the descriptor part of the taxon layout
                        var defaultLayout = application.getRegion('mainRegion').currentView;
                        var taxonLayout = defaultLayout.getRegion('content').currentView;

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
});

module.exports = View;
