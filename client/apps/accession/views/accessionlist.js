/**
 * @file accessionlist.js
 * @brief Accession list view
 * @author Frederic SCHERMA
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var AccessionView = require('../views/accession');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/accessionlist.html"),
    childView: AccessionView,
    childViewContainer: 'tbody.accession-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);

        View.__super__.initialize.apply(this);
    },
});

module.exports = View;
