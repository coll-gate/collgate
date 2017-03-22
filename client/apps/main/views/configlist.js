/**
 * @file configlist.js
 * @brief Config list view
 * @author Frederic SCHERMA
 * @date 2017-03-22
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var ConfigView = require('../views/config');

var View = Marionette.CollectionView.extend({
    template: "<div></div>",
    className: "config-list",
    childView: ConfigView,

    attributes: {
        'style': 'height: 100%; overflow-y: auto;'
    },

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
