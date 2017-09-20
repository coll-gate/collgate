/**
 * @file accessionpaneldescriptorcreate.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-18
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');
var AccessionPanelDescriptorView = require('./accessionpaneldescriptor');

var View = Marionette.View.extend({
        tagName: 'div',
        template: require('../templates/accessionpaneldescriptorcreate.html'),

        ui: {
            defines: 'button.defines'
        },

        events: {
            'click @ui.defines': 'onDefine'
        },

        initialize: function (options) {
        },

        onRender: function () {
        },

        onDefine: function (e) {
            var model = this.model;

            $.ajax({
                type: "GET",
                url: application.baseUrl + 'descriptor/meta-model/for-describable/' + 'accession.accessionpanel/',
                dataType: 'json'
            }).done(function (data) {
                var CreateDescriptorView = Dialog.extend({
                    attributes: {
                        'id': 'dlg_create_descriptor'
                    },
                    template: require('../templates/accessionpaneldescriptorcreatedialog.html'),
                    templateContext: function () {
                        return {
                            meta_models: data
                        };
                    },

                    ui: {
                        validate: "button.continue",
                        meta_model: "#meta_model"
                    },

                    events: {
                        'click @ui.validate': 'onContinue'
                    },

                    onRender: function () {
                        CreateDescriptorView.__super__.onRender.apply(this);

                        this.ui.meta_model.selectpicker({});
                    },

                    onBeforeDestroy: function () {
                        this.ui.meta_model.selectpicker('destroy');

                        CreateDescriptorView.__super__.onBeforeDestroy.apply(this);
                    },

                    onContinue: function () {
                        var view = this;
                        var model = this.getOption('model');

                        if (this.ui.meta_model.val() != null) {
                            var metaModel = parseInt(this.ui.meta_model.val());

                            view.destroy();

                            // update the descriptor part of the accessionPanel layout
                            // var accessionPanelLayout = application.main.viewContent();

                            // patch the accessionPanel descriptor meta model
                            model.save(
                                {
                                    descriptor_meta_model: metaModel
                                },

                                {
                                    patch: true,
                                    wait: false
                                }
                            )

                            // $.ajax({
                            //     method: "GET",
                            //     url: application.baseUrl + 'descriptor/meta-model/' + metaModel + '/layout/',
                            //     dataType: 'json'
                            // }).done(function (data) {
                            //     var accessionPanelDescriptorView = new AccessionPanelDescriptorView({
                            //         model: model,
                            //         descriptorMetaModelLayout: data
                            //     });
                            //     accessionPanelLayout.showChildView('descriptors', accessionPanelDescriptorView);
                            // });
                        }
                    }
                });

                var createDescriptorView = new CreateDescriptorView({model: model});
                createDescriptorView.render();
            })
            ;
        },

        onShowTab: function () {
            var view = this;

            var DefaultLayout = require('../../main/views/defaultlayout');
            var contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);

            var actions = [];

            actions.push('add');

            var AccessionPanelDescriptorContextView = require('./accessionpaneldescriptorcontext');
            var contextView = new AccessionPanelDescriptorContextView({actions: actions});

            var TitleView = require('../../main/views/titleview');
            contextLayout.showChildView('title', new TitleView({
                title: gt.gettext("Descriptors"),
                glyphicon: 'glyphicon-wrench'
            }));
            contextLayout.showChildView('content', contextView);

            contextView.on("descriptormetamodel:add", function () {
                view.onDefine();
            });
        }
    })
;

module.exports = View;