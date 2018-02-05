/**
 * @file classificationentrydescriptorcreate.js
 * @brief Classification entry create descriptor view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');
let ClassificationEntryDescriptorView = require('./classificationentrydescriptor');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/classificationentrydescriptorcreate.html'),

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
        let model = this.model;

        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'layout', 'for-describable', 'classification.classificationentry']),
            dataType: 'json',
        }).done(function(data) {
            let CreateDescriptorView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_descriptor',
                },
                template: require('../templates/classificationentrydescriptorcreatedialog.html'),
                templateContext: function () {
                    return {
                        layouts: data,
                    };
                },

                ui: {
                    validate: "button.continue",
                    layout: "#layout",
                },

                events: {
                    'click @ui.validate': 'onContinue'
                },

                onRender: function () {
                    CreateDescriptorView.__super__.onRender.apply(this);

                    this.ui.layout.selectpicker({});
                },

                onBeforeDestroy: function() {
                    this.ui.layout.selectpicker('destroy');

                    CreateDescriptorView.__super__.onBeforeDestroy.apply(this);
                },

                onContinue: function() {
                    let view = this;
                    let model = this.getOption('model');

                    if (this.ui.layout.val() != null) {
                        let metaModel = parseInt(this.ui.layout.val());

                        view.destroy();

                        // update the descriptor part of the classificationEntry layout
                        let classificationEntryLayout = application.main.viewContent();

                        // patch the classificationEntry descriptor meta model
                        model.save({layout: metaModel}, {patch: true, wait: false});

                        $.ajax({
                            method: "GET",
                            url: window.application.url(['descriptor', 'layout', metaModel]),
                            dataType: 'json',
                        }).done(function(data) {
                            let classificationEntryDescriptorView = new ClassificationEntryDescriptorView({
                                model: model,
                                layoutData: data
                            });
                            classificationEntryLayout.showChildView('descriptors', classificationEntryDescriptorView);
                        });
                    }
                }
            });

            let createDescriptorView = new CreateDescriptorView({model: model});
            createDescriptorView.render();
        });
    },

    onShowTab: function() {
        let view = this;

        let DefaultLayout = require('../../main/views/defaultlayout');
        let contextLayout = new DefaultLayout();
        application.getView().showChildView('right', contextLayout);

        let actions = [];

        actions.push('add');

        let ClassificationEntryDescriptorContextView = require('./classificationentrydescriptorcontext');
        let contextView = new ClassificationEntryDescriptorContextView({actions: actions});

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));
        contextLayout.showChildView('content', contextView);

        contextView.on("descriptormetamodel:add", function() {
            view.onDefine();
        });
    }
});

module.exports = View;
