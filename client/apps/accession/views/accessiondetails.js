/**
 * @file accessiondetails.js
 * @brief Accession details item view
 * @author Frederic SCHERMA
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var AccessionEditView = require('../views/accessionedit');

var View = DescribableDetails.extend({
    onModify: function () {
        // does not reload models, just redo the views
        var name = this.model.get('name');

        // update the layout content
        var accessionLayout = application.view().getRegion('content').currentView;

        var view = new AccessionEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        accessionLayout.getRegion('descriptors').show(view);
    }
});

module.exports = View;