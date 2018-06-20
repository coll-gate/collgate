/**
 * @file personlist.js
 * @brief Person list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-04
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let AdvancedTable = require('../../main/views/advancedtable');
let PersonView = require('../views/person');
let DescriptorsColumnsView = require('../../descriptor/mixins/descriptorscolumns');

let View = AdvancedTable.extend({
    className: "person-list advanced-table-container",
    childView: PersonView,

    userSettingName: 'person_list_columns',
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
        {name: 'code', width: 'auto', sort_by: null},
        {name: '#ORG_FULL_NAME', width: 'auto', sort_by: '+0'},
        {name: '#ORG_FIRST_NAME', width: 'auto', sort_by: '+0'},
        {name: '#ORG_LAST_NAME', width: 'auto', sort_by: null}
    ],

    columnsOptions: {
        'code': {label: _t('Code'), minWidth: true, event: 'view-person', format: {type: 'string'}},
        '#ORG_FULL_NAME': {label: _t('Full name'), minWidth: true, event: 'view-person', format: {type: 'string'}},
        '#ORG_FIRST_NAME': {label: _t('First name'), minWidth: true, event: 'view-person', format: {type: 'string'}},
        '#ORG_LAST_NAME': {label: _t('Last name'), minWidth: true, format: {type: 'string'}}
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
        contextLayout.showChildView('title', new TitleView({title: _t("Person/Contact")}));

        let actions = ['add'];

        let PersonListContextView = require('./personlistcontext');
        let contextView = new PersonListContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("person:add", function () {
            window.application.organisation.controllers.person.create(
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
