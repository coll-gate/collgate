/**
 * @file descriptorvaluelist.js
 * @brief List of values for a type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorValueModel = require('../models/descriptorvalue');
var DescriptorValueView = require('../views/descriptorvalue');

var View = Marionette.CompositeView.extend({
    template: require("../templates/descriptorvaluelist.html"),
    childView: DescriptorValueView,
    childViewContainer: 'tbody.descriptor-value-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);

        this.page = 1;

        // pagination on scrolling
        $("div.panel-body").scroll($.proxy(function(e) { this.scroll(e); }, this));
    },

    onRender: function() {
    },

    scroll: function(e) {
        if (e.target.scrollHeight-e.target.clientHeight == e.target.scrollTop) {
            if (this.collection.size() < this.collection.total_count) {
                Logger.debug("fetch page " + (this.page+1) + " for " + this.collection.total_count + " items");
                this.collection.fetch({update: true, remove: false, data: {page: ++this.page}});
            }
        }
    },
});

module.exports = View;
