/**
 * @file descriptormodelalt.js
 * @brief Alternative model of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorModelModel = require('../models/descriptormodel');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-model',
    template: require('../templates/descriptormodelalt.html'),

    events: {
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },
});

module.exports = View;
