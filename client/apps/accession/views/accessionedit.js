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

var View = DescribableEdit.extend({
    onCancel: function() {
        // non existing accession, simply reload previous content (url has not changed)
        if (this.model.isNew()) {
            Backbone.history.loadUrl();
            return;
        }

        // does not reload models, just redo the views
        var view = this;
        var name = this.model.get('name');

        // update the layout content
        var accessionLayout = application.getRegion('mainRegion').currentView.getRegion('content').currentView;

        var AccessionDetailsView = require('../views/accessiondetails');
        var accessionDetailsView = new AccessionDetailsView({
            model: this.model,
            descriptorMetaModelLayout: view.descriptorMetaModelLayout});

        accessionLayout.getRegion('descriptors').show(accessionDetailsView);
    },

    onApply: function () {
        // does not reload  models, save and redo the views
        var view = this;
        var model = this.model;

        var descriptors = this.prepareDescriptors();
        if (descriptors === null) {
            return;
        }
        console.log(descriptors)

        /*this.model.save({descriptors: descriptors}, {wait: true, patch: !model.isNew()}).then(function () {
            //Backbone.history.navigate('app/accession/accession/' + model.get('id') + '/', {trigger: true, replace: true});
            var accessionLayout = application.getRegion('mainRegion').currentView.getRegion('content').currentView;

            // update the layout content
            var AccessionDetailsView = require('../views/accessiondetails');
            var accessionDetailsView = new AccessionDetailsView({
                model: model,
                descriptorMetaModelLayout: view.descriptorMetaModelLayout});

            accessionLayout.getRegion('descriptors').show(accessionDetailsView);
        });*/
    }
});

module.exports = View;
