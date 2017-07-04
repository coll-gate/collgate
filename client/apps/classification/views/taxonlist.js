/**
 * @file taxonlist.js
 * @brief Taxon list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var TaxonView = require('../views/taxon');
var ScrollView = require('../../main/views/scroll');
var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = ScrollView.extend({
    template: require("../../descriptor/templates/entitylist.html"),
    className: "taxon-list advanced-table-container",
    childView: TaxonView,
    childViewContainer: 'tbody.entity-list',

    userSettingName: function() {
        return /*this.classification.get('name')*/'taxon' + '_classification_list_columns';
    },

    defaultColumns: [
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'rank', width: 'auto', sort_by: null},
        {name: 'parent', width: 'auto', sort_by: null},
        {name: 'synonym', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'name': {label: gt.gettext('Name'), width: 'auto', minWidth: true, event: 'view-taxon-details'},
        'rank': {label: gt.gettext('Rank'), width: 'auto', minWidth: true, custom: 'rankCell'},
        'parent': {
            label: gt.gettext('Parent'),
            width: 'auto',
            minWidth: true,
            event: 'view-parent-details',
            custom: 'parentCell',
            field: 'name'
        },
        'synonym': {
            label: gt.gettext('Synonym'),
            width: 'auto',
            minWidth: true,
            custom: 'synonymCell',
            field: 'name'
        }
    },

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

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        // this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
