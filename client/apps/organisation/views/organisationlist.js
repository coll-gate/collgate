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
var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = ScrollView.extend({
    template: require("../templates/organisationlist.html"),
    className: "object organisation-list advanced-table-container",
    childView: OrganisationView,
    childViewContainer: 'tbody.organisation-list',

    userSettingName: '_organisation_list_columns',
    userSettingVersion: '1.0',

    templateHelpers/*templateContext*/: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    childViewOptions: function () {
        return {
            columnsList: this.displayedColumns,
            columnsOptions: this.getOption('columns')
        }
    },

    defaultColumns: [
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'type', width: 'auto', sort_by: null},
        {name: '#organisation_acronym', width: 'auto', sort_by: null},
        {name: '#organisation_code', width: 'auto', sort_by: null},
        {name: 'num_establishments', width: 'auto', sort_by: null},
    ],

    columnsOptions: {
        'name': {label: gt.gettext('Name'), minWidth: true, event: 'view-organisation'},
        'type': {label: gt.gettext('Type'), minWidth: true, custom: 'organisationTypeCell'},
        '#organisation_acronym': {label: gt.gettext('Acronym'), minWidth: true, format: {type: 'string'}},
        '#organisation_code': {label: gt.gettext('Code'), minWidth: true, format: {type: 'string'}},
        'num_establishments': {
            label: gt.gettext('Establishments'), minWidth: true, event: 'view-establishments', custom: 'numEstablishmentsCell'
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
