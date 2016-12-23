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

var TaxonModel = require('../../taxonomy/models/taxon');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var DescribableLayout = require('../../descriptor/views/describablelayout');

var TaxonSimpleView = require('../../taxonomy/views/taxonsimple');
var AccessionEditView = require('../views/accessionedit');

var View = DescribableDetails.extend({
    onModify: function () {
        var model = this.model;
        var name = model.get('name');
        var parent = model.get('parent').id;

        var defaultLayout = new DefaultLayout();
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accession"), model: model}));

        var describableLayout = new DescribableLayout();
        defaultLayout.getRegion('content').show(describableLayout);

        var taxon = new TaxonModel({id: parent});
        taxon.fetch().then(function() {
            describableLayout.getRegion('header').show(new TaxonSimpleView({model: taxon, entity: model, noLink: true}));
        });

        var view = new AccessionEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        describableLayout.getRegion('body').show(view);
    }
});

module.exports = View;