/**
 * @file establishmentlist.js
 * @brief Establishment list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-09
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let AdvancedTable = require('../../main/views/advancedtable');
let EstablishmentView = require('../views/establishment');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: "establishment-list advanced-table-container",
    childView: EstablishmentView,

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
        'name': {label: _t('Name'), minWidth: true, event: 'view-establishment'},
        '#establishment_code': {label: _t('Code'), minWidth: true, format: {type: 'string'}},
        '#establishment_zipcode': {label: _t('Zipcode'), minWidth: true, format: {type: 'string'}},
        '#establishment_geolocation': {
            label: _t('Location'), minWidth: true, event: 'view-establishments', query: true}
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        // this.listenTo(this.collection, 'reset', this.render, this);
    },
    
    onShowTab: function() {
        let view = this;

        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Establishment")}));

        let actions = ['add'];

        let EstablishmentListContextView = require('./establishmentlistcontext');
        let contextView = new EstablishmentListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("establishment:add", function () {
            window.application.organisation.controllers.establishment.create(
                view.getOption('model'), view.collection);
        });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    },    
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
