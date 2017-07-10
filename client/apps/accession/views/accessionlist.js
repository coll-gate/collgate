/**
 * @file accessionlist.js
 * @brief Accession list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var AccessionView = require('../views/accession');
var ScrollView = require('../../main/views/scroll');
var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = ScrollView.extend({
    template: require("../../descriptor/templates/entitylist.html"),
    className: 'advanced-table-container',
    childView: AccessionView,
    childViewContainer: 'tbody.entity-list',
    userSettingName: 'accessions_list_columns',
    userSettingVersion: '1.0',

    defaultColumns: [
        {name: 'code', width: 'auto', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'parent', width: 'auto', sort_by: null},
        {name: '#IPGRI_4.1.1', width: 'auto', sort_by: null},
        {name: '#MCPD_ORIGCTY', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'code': {label: gt.gettext('Code'), width: 'auto', minWidth: true, event: 'view-accession-details'},
        'name': {label: gt.gettext('Name'), width: 'auto', minWidth: true, event: 'view-accession-details'},
        'parent': {
            label: gt.gettext('Classification'),
            width: 'auto',
            minWidth: true,
            event: 'view-parent-details',
            custom: 'parentCell',
            field: 'name'
        },
        'descriptor_meta_model': {label: gt.gettext('Model'), width: 'auto', minWidth: true}
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

        // this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
