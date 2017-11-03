/**
 * @file descriptorgroupalt.js
 * @brief Alternative view for group of type of descriptor item
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let DescriptorGroupModel = require('../models/descriptorgroup');

let DescriptorTypeCollection = require('../collections/descriptortype');
let DescriptorTypeListAltView = require('./descriptortypelistalt');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object descriptor-group-alt',
    template: require('../templates/descriptorgroupalt.html'),

    events: {
        'click': 'viewDescriptorTypes'
    },

    initialize: function(options) {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    viewDescriptorTypes: function() {
        let layout = this.getOption('layout');
        let collection = new DescriptorTypeCollection([], {group_id: this.model.id});

        collection.fetch().then(function () {
            let descriptorTypeListView = new DescriptorTypeListAltView({collection : collection});

            layout.showChildView('right-down-content', descriptorTypeListView);
            layout.showChildView('right-down-bottom', new ScrollingMoreView({targetView: descriptorTypeListView}));
        });
    },
});

module.exports = View;
