/**
 * @file organisationlist.js
 * @brief Organisation list view
 * @author Frederic SCHERMA
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var ScrollView = require('../../main/views/scroll');
var OrganisationView = require('../views/organisation');

var View = ScrollView.extend({
    template: require("../templates/organisationlist.html"),
    childView: OrganisationView,
    childViewContainer: 'tbody.organisation-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);

        View.__super__.initialize.apply(this);
    }
});

module.exports = View;
