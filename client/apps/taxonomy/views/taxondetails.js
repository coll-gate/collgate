/**
 * @file taxondetails.js
 * @brief Taxon detailed view
 * @author Frederic SCHERMA
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonView = require('./taxon');
var TaxonModel = require('../models/taxon');

// TODO use of regions
/*
var TaxonDetailsView = Marionette.CompositeView.extend({
    el: '#main_content ',
    template: require('../templates/taxondetails.html'),
    childView: TaxonView,
    childViewContainer: 'div.panel-body',

    initialize: function() {
        this.model.fetch();

        // need some collections to be fetched
        this.listenTo(ohgr.main.collections.languages, 'sync', this.render, this);
        this.listenTo(ohgr.main.collections.synonymTypes, 'sync', this.render, this);
        this.listenTo(ohgr.taxonomy.collections.taxonRanks, 'sync', this.render, this);

        this.listenTo(this.model, 'sync', this.render, this);
    },

    onRender: function() {
        // render select fields
        ohgr.main.views.languages.render();
        ohgr.main.views.synonymTypes.render();
        ohgr.taxonomy.views.taxonRanks.render();
    }
});*/

//module.exports = TaxonDetailsView;
