/**
 * @file taxondescriptoredit.js
 * @brief Taxon descriptor edit view
 * @author Frederic SCHERMA
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableEdit = require('../../descriptor/views/describableedit');

var View = DescribableEdit.extend({
    onCancel: function() {
        // does not reload models, just redo the views
        var view = this;
        var model = this.model;
        var name = model.get('name');

        // update the descriptor part of the taxon layout
        var taxonLayout = application.view().getRegion('content').currentView;

        var TaxonDescriptorView = require('../views/taxondescriptor');
        var taxonDescriptorView = new TaxonDescriptorView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        taxonLayout.getRegion('descriptors').show(taxonDescriptorView);
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
            // update the descriptor part of the taxon layout
            var taxonLayout = application.view().getRegion('content').currentView;

            var TaxonDescriptorView = require('../views/taxondescriptor');
            var taxonDescriptorView = new TaxonDescriptorView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            taxonLayout.getRegion('descriptors').show(taxonDescriptorView);
        });
    }
});

module.exports = View;
