/**
 * @file taxondescriptoredit.js
 * @brief Taxon descriptor edit view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescribableEdit = require('../../descriptor/views/describableedit');

var View = DescribableEdit.extend({
    onCancel: function() {
        // cancel global widget modifications
        this.cancel();

        // non existing taxon, simply reload previous content (url has not changed)
        if (this.model.isNew()) {
            Backbone.history.loadUrl();
            return;
        }

        // does not reload models, just redo the views
        var view = this;
        var model = this.model;
        var name = model.get('name');

        // update the descriptor part of the taxon layout
        var taxonLayout = application.view().getRegion('content').currentView;

        var TaxonDescriptorView = require('./taxondescriptor');
        var taxonDescriptorView = new TaxonDescriptorView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        taxonLayout.getRegion('descriptors').show(taxonDescriptorView);
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
            // update the descriptor part of the taxon layout
            var taxonLayout = application.view().getRegion('content').currentView;

            var TaxonDescriptorView = require('./taxondescriptor');
            var taxonDescriptorView = new TaxonDescriptorView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            taxonLayout.getRegion('descriptors').show(taxonDescriptorView);
        });
    },

    onShowTab: function() {
        var view = this;

        // contextual panel
        var contextLayout = application.getView().getRegion('right').currentView;
        if (!contextLayout) {
            var DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().getRegion('right').show(contextLayout);
        }

        var TitleView = require('../../main/views/titleview');
        contextLayout.getRegion('title').show(new TitleView({title: gt.gettext("Descriptors"), glyphicon: 'glyphicon-wrench'}));

        var actions = ['apply', 'cancel'];

        var TaxonDescriptorContextView = require('../views/taxondescriptorcontext');
        var contextView = new TaxonDescriptorContextView({actions: actions});
        contextLayout.getRegion('content').show(contextView);

        contextView.on("describable:cancel", function() {
            view.onCancel();
        });

        contextView.on("describable:apply", function() {
            view.onApply();
        });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    }
});

module.exports = View;
