/**
 * @file descriptormodellist.js
 * @brief List of model of descriptors view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorModelView = require('../views/descriptormodel');
let AdvancedTable = require('../../main/views/advancedtable');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    template: require("../templates/descriptormodellist.html"),
    className: "descriptor-model-list advanced-table-container",
    childView: DescriptorModelView,
    //childViewContainer: 'tbody.descriptor-model-list',
    childViewContainer: 'tbody.entity-list',
    // userSettingVersion: '1.0',
    // userSettingName: "",

    defaultColumns: [
        {name: 'description', width: 'fixed', sort_by: null},
        {name: 'name', width: 'auto', sort_by: '+0'},
        {name: 'verbose_name', width: 'auto', sort_by: '+0'},
        {name: 'num_descriptor_model_types', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'description': {
            label: '',
            width: 'auto',
            glyphicon: ['fa-info-circle', 'fa-question-circle'],
            fixed: true
        },
        'name': {label: _t('Name'), width: 'auto', minWidth: true, event: 'view-accession-details'},
        'verbose_name': {label: _t('Verbose name'), width: 'auto', minWidth: true, event: 'view-accession-details'},
        'num_descriptor_model_types': {label: _t('Types'), width: 'auto', minWidth: true, event: 'view-descriptor-model-details'}
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

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        this.filters = this.getOption('filters');
        // this.listenTo(this.collection, 'reset', this.render, this);
    }
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
