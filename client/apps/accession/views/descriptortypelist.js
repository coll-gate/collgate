/**
 * @file descriptortypelist.js
 * @brief List of types of descriptors for a group view
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorTypeModel = require('../models/descriptortype');
var DescriptorTypeView = require('../views/descriptortype');

var View = Marionette.CompositeView.extend({
    template: require("../templates/descriptortypelist.html"),
    childView: DescriptorTypeView,
    childViewContainer: 'tbody.descriptor-type-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);

        // pagination on scrolling
        $("div.panel-body").scroll($.proxy(function(e) { this.scroll(e); }, this));
    },

    onRender: function() {
    },

    scroll: function(e) {
        if (e.target.scrollHeight-e.target.clientHeight == e.target.scrollTop) {
            if (this.collection.next != null) {
                Logger.debug("descriptorType::fetch next with cursor=" + (this.collection.next));
                this.collection.fetch({update: true, remove: false, data: {cursor: this.collection.next}});
            }
        }
    },
});

module.exports = View;
