/**
 * @file establishmentlist.js
 * @brief Establishment list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-09
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ScrollView = require('../../main/views/scroll');
var EstablishmentView = require('../views/establishment');

var DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

var View = ScrollView.extend({
    template: require("../templates/establishmentlist.html"),
    className: "object establishment-list advanced-table-container",
    childView: EstablishmentView,
    childViewContainer: 'tbody.establishment-list',

    userSettingName: '_establishment_list_columns',
    userSettingVersion: '1.0',

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

    defaultColumns: [
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: '#establishment_code', width: 'auto', sort_by: null},
        {name: '#establishment_zipcode', width: 'auto', sort_by: null},
        {name: '#establishment_geolocation', width: 'auto', sort_by: null},
    ],

    columnsOptions: {
        'name': {label: gt.gettext('Name'), minWidth: true, event: 'view-establishment'},
        '#establishment_code': {label: gt.gettext('Code'), minWidth: true, format: {type: 'string'}},
        '#establishment_zipcode': {label: gt.gettext('Zipcode'), minWidth: true, format: {type: 'string'}},
        '#establishment_geolocation': {
            label: gt.gettext('Location'), minWidth: true, event: 'view-establishments', query: true}
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
