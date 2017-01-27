/**
 * @file taxondescriptor.js
 * @brief Taxon descriptors view
 * @author Frederic SCHERMA
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var TaxonDescriptorEditView = require('../views/taxondescriptoredit');

var View = DescribableDetails.extend({
    onModify: function () {
        // does not reload models, just redo the views
        var model = this.model;
        var name = model.get('name');

        // update the descriptor part of the taxon layout
        var taxonLayout = application.view().getRegion('content').currentView;

        var view = new TaxonDescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        taxonLayout.getRegion('descriptors').show(view);
    }
});

module.exports = View;
