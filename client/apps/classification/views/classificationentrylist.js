/**
 * @file classificationentrylist.js
 * @brief Classification entry list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ClassificationEntryView = require('./classificationentry');
var AdvancedTable = require('../../main/views/advancedtable');
var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = AdvancedTable.extend({
    template: require("../../descriptor/templates/entitylist.html"),
    className: "classification-entry-list advanced-table-container",
    childView: ClassificationEntryView,
    childViewContainer: 'tbody.entity-list',

    userSettingName: function() {
        return /*this.classification.get('name')*/'classificationentry' + '_classification_list_columns';
    },
    userSettingVersion: '1.0',

    defaultColumns: [
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'rank', width: 'auto', sort_by: null},
        {name: 'parent', width: 'auto', sort_by: null},
        {name: 'synonym', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-classification-entry-details'},
        'rank': {
            label: _t('Rank'),
            width: 'auto',
            minWidth: true,
            custom: 'rankCell',
            field: 'level'
        },
        'parent': {
            label: _t('Parent'),
            width: 'auto',
            minWidth: true,
            event: 'view-parent-details',
            custom: 'parentCell',
            field: 'name'
        },
        'synonym': {
            label: _t('Synonym'),
            width: 'auto',
            minWidth: true,
            custom: 'synonymCell',
            field: 'name'
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

        // this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
