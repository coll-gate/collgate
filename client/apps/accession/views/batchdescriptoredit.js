/**
 * @file batchdescriptoredit.js
 * @brief Batch descriptor item edit view
 * @author Frederic SCHERMA
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableEdit = require('../../descriptor/views/describableedit');

var View = DescribableEdit.extend({
    setContextualPanel: function (descriptorView) {
        // contextual panel
        var contextLayout = application.getView().getRegion('right').currentView;

        var actions = ['modify'];

        var BatchDescriptorContextView = require('./batchdescriptorcontext');
        var contextView = new BatchDescriptorContextView({actions: actions})
        contextLayout.getRegion('content').show(contextView);

        contextView.on("describable:modify", function() {
            descriptorView.onModify();
        });
    },

    onCancel: function() {
        // cancel global widget modifications
        this.cancel();

        // non existing accession, simply reload previous content (url has not changed)
        if (this.model.isNew()) {
            Backbone.history.loadUrl();
            return;
        }

        // does not reload models, just redo the views
        var view = this;
        var name = this.model.get('name');

        // update the layout content
        var batchLayout = application.view().getRegion('content').currentView;

        var BatchDescriptorView = require('../views/batchdescriptor');
        var batchDescriptorView = new BatchDescriptorView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        batchLayout.getRegion('descriptors').show(batchDescriptorView);

        this.setContextualPanel(batchDescriptorView);
    },

    onApply: function () {
        // does not reload models, save and redo the views
        var view = this;
        var model = this.model;

        var descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        this.model.save({descriptors: descriptors}, {wait: true, patch: !model.isNew()}).then(function () {
            //Backbone.history.navigate('app/accession/batch/' + model.get('id') + '/', {trigger: true, replace: true});
            var batchLayout = application.view().getRegion('content').currentView;

            // update the layout content
            var BatchDescriptorView = require('../views/batchdescriptor');
            var batchDescriptorView = new BatchDescriptorView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            batchLayout.getRegion('descriptors').show(batchDescriptorView);

            view.setContextualPanel(batchDescriptorView);
        });
    }
});

module.exports = View;
