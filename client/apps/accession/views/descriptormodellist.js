/**
 * @file descriptormodellist.js
 * @brief List of model of descriptors view
 * @author Frederic SCHERMA
 * @date 2016-09-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorModelModel = require('../models/descriptormodel');
var DescriptorModelView = require('../views/descriptormodel');

var View = Marionette.CompositeView.extend({
    template: require("../templates/descriptormodellist.html"),
    childView: DescriptorModelView,
    childViewContainer: 'tbody.descriptor-model-list',

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
                Logger.debug("descriptorModel::fetch next with cursor=" + (this.collection.next));
                this.collection.fetch({update: true, remove: false, data: {cursor: this.collection.next}});
            }
        }
    },
});

module.exports = View;
