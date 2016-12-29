/**
 * @file accessionedit.js
 * @brief Accession entity item edit view
 * @author Frederic SCHERMA
 * @date 2016-12-15
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableEdit = require('../../descriptor/views/describableedit');

var TaxonSimpleView = require('../../taxonomy/views/taxonsimple');


var View = DescribableEdit.extend({
    onCancel: function() {
        // does not reload models, just redo the views
        var view = this;
        var model = this.model;
        var name = model.get('name');

        // update the layout content
        var describableLayout = application.getRegion('mainRegion').currentView.getRegion('content').currentView;

        var taxon = describableLayout.getRegion('header').currentView.model;
        describableLayout.getRegion('header').show(new TaxonSimpleView({model: taxon, entity: model}));

        var AccessionDetailsView = require('../views/accessiondetails');
        var accessionDetailsView = new AccessionDetailsView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        describableLayout.getRegion('body').show(accessionDetailsView);
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
            var describableLayout = application.getRegion('mainRegion').currentView.getRegion('content').currentView;

            // update the layout content
            var taxon = describableLayout.getRegion('header').currentView.model;
            describableLayout.getRegion('header').show(new TaxonSimpleView({model: taxon, entity: model}));

            var AccessionDetailsView = require('../views/accessiondetails');
            var accessionDetailsView = new AccessionDetailsView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            describableLayout.getRegion('body').show(accessionDetailsView);
        });
    }
});

module.exports = View;
