/**
 * @file taxonlist.js
 * @brief Taxon list view
 * @author Frederic SCHERMA
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../models/taxon');
var TaxonView = require('../views/taxon');

var TaxonListView = Marionette.CollectionView.extend({
    //el: '#main_content',
    //template: require('../templates/taxonlist.html'),
    template: "<div></div>",
    className: "taxon-list",
    childView: TaxonView,
    //childViewContainer: 'div.panel-body',

    ui: {
        editmode: '.edit-mode',
        taxon: 'span.taxon',
    },

    events: {
        'click @ui.taxon': 'clickTaxon',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        //this.listenTo(this.collection, 'change', this.render, this);

        ohgr.main.readonly = true;
    },

    onRender: function() {
    },

    clickTaxon: function (e) {
        var id = e.target.getAttribute("taxonid");
        Backbone.history.navigate("app/taxonomy/" + id + "/", {trigger: true});
    },

    onDomRefresh: function () {
        $(this.ui.editmode).hide();
    },
});

module.exports = TaxonListView;
