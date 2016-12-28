/**
 * @file taxonentities.js
 * @brief Taxon entities list view
 * @author Frederic SCHERMA
 * @date 2016-12-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var TaxonEntityView = require('../views/taxonentity');
var ScrollView = require('../../main/views/scroll');


var View = ScrollView.extend({
    template: require("../templates/taxonentitieslist.html"),
    className: "taxon-entity-list",
    childView: TaxonEntityView,
    childViewContainer: 'tbody.entities-list',

    initialize: function(options) {
        options || (options = {});

        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo($('window'), 'load', this.resize, this);
        this.listenTo($('window'), 'resize', this.resize, this);

        $(window).resize($.proxy(this.resize, this));

        $("div.panel-body").find('a[data-toggle="tab"][href="#taxon_entities"]').on('shown.bs.tab', $.proxy(function(e) {
            this.resize(e);
        }, this));
        //this.resize();
    },

    resize: function(e) {
        var container = $(this.el).parent();
        var bottomHeight = container.parent().children("div.entities-bottom").children("div").outerHeight(true);

        // 10 is the padding before nav bar
        var h = $("div.panel-body").height() - $("#taxon_details").outerHeight(true) - 10 - $("ul.nav-tabs").outerHeight(true) - bottomHeight;
        this.$el.height(Math.max(32, h-1));
    }
});

module.exports = View;
