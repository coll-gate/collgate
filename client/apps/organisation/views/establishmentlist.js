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

    userSettingName: 'establishment_list_columns',
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
        {name: '#DE_002', width: 'auto', sort_by: null},
        {name: '#DE_004', width: 'auto', sort_by: null},
        {name: '#GE_003', width: 'auto', sort_by: null},
    ],

    columnsOptions: {
        'name': {label: _t('Name'), minWidth: true, event: 'view-establishment'},
        '#DE_002': {label: _t('Code'), minWidth: true, format: {type: 'string'}},
        '#DE_004': {label: _t('Zipcode'), minWidth: true, format: {type: 'string'}},
        '#GE_003': {label: _t('Location'), minWidth: true, event: 'view-establishments', query: true}
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this, arguments);

        // this.listenTo(this.collection, 'reset', this.render, this);
    },
    
    onShowTab: function() {
        let view = this;

        let contextLayout = window.application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            window.application.getView().showChildView('right', contextLayout);
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

        View.__super__.onShowTab.apply(this, arguments);
    },

    onHideTab: function() {
        window.application.main.defaultRightView();
    },    
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
