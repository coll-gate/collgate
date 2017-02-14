/**
 * @file accessiondescriptoredit.js
 * @brief Accession descriptor item edit view
 * @author Frederic SCHERMA
 * @date 2016-12-15
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableEdit = require('../../descriptor/views/describableedit');

var View = DescribableEdit.extend({
    setContextualPanel: function (taxonDescriptorView) {
        // contextual panel
        var contextLayout = application.getView().getRegion('right').currentView;

        var actions = ['modify'];

        var AccessionDescriptorsContextView = require('./accessiondescriptorscontext');
        var contextView = new AccessionDescriptorsContextView({actions: actions})
        contextLayout.getRegion('content').show(contextView);

        contextView.on("describable:modify", function() {
            taxonDescriptorView.onModify();
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
        var accessionLayout = application.view().getRegion('content').currentView;

        var AccessionDescriptorView = require('../views/accessiondescriptor');
        var accessionDescriptorView = new AccessionDescriptorView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        accessionLayout.getRegion('descriptors').show(accessionDescriptorView);

        this.setContextualPanel(accessionDescriptorView);
    },

    onApply: function () {
        // does not reload  models, save and redo the views
        var view = this;
        var model = this.model;

        var descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }

        this.model.save({descriptors: descriptors}, {wait: true, patch: !model.isNew()}).then(function () {
            //Backbone.history.navigate('app/accession/accession/' + model.get('id') + '/', {trigger: true, replace: true});
            var accessionLayout = application.view().getRegion('content').currentView;

            // update the layout content
            var AccessionDescriptorView = require('../views/accessiondescriptor');
            var accessionDescriptorView = new AccessionDescriptorView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            accessionLayout.getRegion('descriptors').show(accessionDescriptorView);

            view.setContextualPanel(accessionDescriptorView);
        });
    }
});

module.exports = View;
