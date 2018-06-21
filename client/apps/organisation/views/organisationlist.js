/**
 * @file organisationlist.js
 * @brief Organisation list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let OrganisationView = require('./organisation');
let AdvancedTable = require('../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: "organisation-list advanced-table-container",
    childView: OrganisationView,

    // defaultSortBy: ['name'],
    
    userSettingName: 'organisation_list_columns',
    userSettingVersion: '1.1',

    defaultColumns: [
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'type', width: 'auto', sort_by: null},
        {name: '#DE_001', width: 'auto', sort_by: null},
        {name: '#DE_002', width: 'auto', sort_by: null},
        {name: 'grc', width: 'auto', sort_by: null},
        {name: 'num_establishments', width: 'auto', sort_by: null},
    ],

    columnsOptions: {
        'name': {label: _t('Name'), minWidth: true, event: 'view-organisation'},
        'type': {label: _t('Type'), minWidth: true, custom: 'organisationTypeCell'},
        '#DE_001': {label: _t('Acronym'), minWidth: true, format: {type: 'string'}},
        '#DE_002': {label: _t('Code'), minWidth: true, format: {type: 'string'}},
        'grc': {label: _t('Partner'), minWidth: true, width: '175px', custom: 'organisationGRCCell'},
        'num_establishments': {
            label: _t('Establishments'), minWidth: true, event: 'view-establishments', custom: 'numEstablishmentsCell'
        }
    },

    templateContext: function () {
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

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);
        // this.filters = this.getOption('filters');

        //this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
