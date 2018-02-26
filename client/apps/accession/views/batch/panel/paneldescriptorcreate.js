/**
 * @file paneldescriptorcreate.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-06
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../../../main/views/dialog');

let View = Marionette.View.extend({
        tagName: 'div',
        template: require('../../../templates/paneldescriptorcreate.html'),

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
            let model = this.model;

            $.ajax({
                type: "GET",
                url: window.application.url(['descriptor', 'layout', 'for-describable', 'accession.batchpanel']),
                dataType: 'json'
            }).done(function (data) {
                let CreateDescriptorView = Dialog.extend({
                    attributes: {
                        'id': 'dlg_create_descriptor'
                    },
                    template: require('../../../templates/descriptorcreatedialog.html'),
                    templateContext: function () {
                        return {
                            layouts: data
                        };
                    },

                    ui: {
                        validate: "button.continue",
                        layout: "#layout"
                    },

                    events: {
                        'click @ui.validate': 'onContinue'
                    },

                    onRender: function () {
                        CreateDescriptorView.__super__.onRender.apply(this);

                        this.ui.layout.selectpicker({});
                    },

                    onBeforeDestroy: function () {
                        this.ui.layout.selectpicker('destroy');

                        CreateDescriptorView.__super__.onBeforeDestroy.apply(this);
                    },

                    onContinue: function () {
                        let view = this;
                        let model = this.getOption('model');

                        if (this.ui.layout.val() != null) {
                            let layoutId = parseInt(this.ui.layout.val());

                            view.destroy();

                            model.save(
                                {
                                    layout: layoutId
                                },

                                {
                                    patch: true,
                                    wait: false
                                }
                            )
                        }
                    }
                });

                let createDescriptorView = new CreateDescriptorView({model: model});
                createDescriptorView.render();
            })
            ;
        },

        onShowTab: function () {
            let view = this;

            let DefaultLayout = require('../../../../main/views/defaultlayout');
            let contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);

            let actions = [];

            actions.push('add');

            let BatchPanelDescriptorContextView = require('./paneldescriptorcontext');
            let contextView = new BatchPanelDescriptorContextView({actions: actions});

            let TitleView = require('../../../../main/views/titleview');
            contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));
            contextLayout.showChildView('content', contextView);

            contextView.on("layout:add", function () {
                view.onDefine();
            });
        }
    })
;

module.exports = View;
