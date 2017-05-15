/**
 * @file organisationlist.js
 * @brief Organisation list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ScrollView = require('../../main/views/scroll');
var OrganisationView = require('../views/organisation');

var View = ScrollView.extend({
    template: require("../templates/organisationlist.html"),
    className: "object organisation-list advanced-table-container",
    childView: OrganisationView,
    childViewContainer: 'tbody.organisation-list',
    userSettingName: '_organisation_list_columns',

    templateHelpers/*templateContext*/: function () {
        return {
            columns: this.displayedColumns
        }
    },

    childViewOptions: function () {
        return {
            columns: this.displayedColumns
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        this.displayedColumns = [
            {name: 'organisation_acronym', label: 'Acronym'},
            {name: 'organisation_code', label: 'Code'}
        ];

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
