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
    //childViewContainer: 'div.panel-body',
    childView: TaxonView,
    childViewOptions: function(model, index) {
        return {
            read_only: this.options.read_only
        }
    },

    ui: {
        add_synonyom_panel: 'tr.add-synonym-panel',
        taxon: 'span.taxon',
    },

    events: {
        'click @ui.taxon': 'clickTaxon',
    },

    initialize: function(options) {
        options || (options = {});
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        //this.listenTo(this.collection, 'change', this.render, this);
    },

    onRender: function() {
    },

    clickTaxon: function (e) {
        var id = e.target.getAttribute("taxonid");
        Backbone.history.navigate("app/taxonomy/" + id + "/", {trigger: true});
    },

    onDomRefresh: function () {
    //    if (this.options.read_only)
    //        $(this.ui.add_synonyom_panel).remove();
    },
});

module.exports = TaxonListView;
