/**
 * @file descriptormodeltypelist.js
 * @brief List of type of model of descriptors for a model model of descriptor view
 * @author Frederic SCHERMA
 * @date 2016-09-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorModelModel = require('../models/descriptormodel');
//var DescriptorModelTypeModel = require('../models/descriptormodeltype');
/*var DescriptorModelTypeView = require('../views/descriptormodeltype');
var DescriptorModelTypeView = require('../views/descriptormodeltype');

var View = Marionette.CompositeView.extend({
    template: require("../templates/descriptormodeltypelist.html"),
    childView: DescriptorGroupView,
    childViewContainer: 'tbody.descriptor-group-list',

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
                Logger.debug("descriptorGroup::fetch next with cursor=" + (this.collection.next));
                this.collection.fetch({update: true, remove: false, data: {cursor: this.collection.next}});
            }
        }
    },
});

module.exports = View;
*/