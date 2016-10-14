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
var ScrollView = require('../../main/views/scroll');

var DescriptorModelTypeModel = require('../models/descriptormodeltype');
var DescriptorModelTypeView = require('../views/descriptormodeltype');

var View = ScrollView.extend({
    template: require("../templates/descriptormodeltypelist.html"),
    childView: DescriptorModelTypeView,
    childViewContainer: 'tbody.descriptor-model-type-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);

        View.__super__.initialize.apply(this);
    },
});

module.exports = View;