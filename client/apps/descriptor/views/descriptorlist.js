/**
 * @file descriptorlist.js
 * @brief list of panel descriptors
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-28
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let PanelDescriptor = require('../views/descriptor');

let View = Marionette.CompositeView.extend({
    template: require('../templates/descriptorlist.html'),
    childView: PanelDescriptor,
    childViewContainer: 'ul.list-group',

    initialize: function (options) {
        options || (options = {});

        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.collection, 'reset', this.render, this);
    },
});

module.exports = View;