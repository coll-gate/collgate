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

    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.getOption('columns')
        }
    },

    childViewOptions: function () {
        return {
            columns: this.getOption('columns')
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        options || (options = {});
        options.columns = [
            {id: -1, name: 'organisation_acronym', label: 'Acronym'},
            {id: -1, name: 'organisation_code', label: 'Code'}
        ];

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
