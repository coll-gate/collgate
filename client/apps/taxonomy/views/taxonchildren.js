/**
 * @file taxonchildren.js
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

var ScrollView = require('../../main/views/scroll');


var View = ScrollView.extend({
    template: "<div></div>",
    className: "taxon-list",
    childView: TaxonView,
    attributes: {
    },

    initialize: function(options) {
        options || (options = {});

        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);

        $(window).resize($.proxy(this.resize, this));

        $("div.panel-body").find('a[data-toggle="tab"][href="#taxon_children"]').on('shown.bs.tab', $.proxy(function(e) {
            this.resize(e);
        }, this));
    },

    resize: function(e) {
        var container = $(this.el).parent();
        var bottomHeight = container.parent().children("div.children-bottom").children("div").outerHeight(true);

        // 10 is the padding before nav bar
        var h = $("div.panel-body").height() - $("#taxon_details").outerHeight(true) - 10 - $("ul.nav-tabs").outerHeight(true) - bottomHeight;
        this.$el.height(Math.max(32, h-1));
    }
});

module.exports = View;
