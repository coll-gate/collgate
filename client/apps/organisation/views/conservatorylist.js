/**
 * @file conservatorylist.js
 * @brief Conservatory list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-21
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let AdvancedTable = require('../../main/views/advancedtable');
let ConservatoryView = require('./conservatory');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: "conservatory-list advanced-table-container",
    childView: ConservatoryView,

    userSettingName: 'conservatory_list_columns',
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
        {name: '#code_16', width: 'auto', sort_by: null},
    ],

    columnsOptions: {
        'name': {label: _t('Name'), minWidth: true, event: 'view-conservatory', format: {type: 'string'}},
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
        contextLayout.showChildView('title', new TitleView({title: _t("Conservatory")}));

        let actions = ['add'];

        let ConservatoryListContextView = require('./conservatorylistcontext');
        let contextView = new ConservatoryListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("conservatory:add", function () {
            window.application.organisation.controllers.conservatory.create(
                view.getOption('model'), view.collection);
        });
    },

    onHideTab: function() {
        window.application.main.defaultRightView();
    },
});

// support of descriptors columns extension
_.extend(View.prototype, DescriptorsColumnsView);

module.exports = View;
