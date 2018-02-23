/**
 * @file descriptorlayout.js
 * @brief Layout for descriptor details
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-01-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../main/views/layout');
let DescriptorDetails = require('./descriptordetails');
let ContentBottomFooterLayout = require('../../main/views/contentbottomfooterlayout');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let Layout = LayoutView.extend({
    template: require("../templates/descriptorlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        configuration_tab: 'a[aria-controls=configuration]',
        values_tab: 'a[aria-controls=values]',
    },

    regions: {
        'configuration': "div.tab-pane[name=configuration]",
        'values': "div.tab-pane[name=values]"
    },

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onDescriptorCreate, this);
        }
    },

    onDescriptorCreate: function () {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/descriptor/descriptor/' + this.model.get('id') + '/', {
            replace: false
        });
    },

    disableValuesTab: function () {
        this.ui.values_tab.parent().addClass('disabled');
    },

    enableTabs: function () {
        this.ui.values_tab.parent().removeClass('disabled');
    },

    onRender: function () {
        let format = this.model.get('format');
        let descriptorLayout = this;

        // configuration tab
        let descriptorDetails = new DescriptorDetails({model: this.model});
        descriptorLayout.showChildView('configuration', descriptorDetails);

        if (!this.model.isNew()) {
            if (_.indexOf(window.application.descriptor.format_with_value_list, format.type) !== -1) {

                let model = this.model;
                let DescriptorValueCollection = require('../collections/descriptorvalue');
                let collection = new DescriptorValueCollection([], {
                    type_id: this.model.id,
                    // filters: (options.filters || {}),
                });

                // values tab
                collection.fetch().then(function () {
                    let valueListView = null;

                    let DescriptorValueListView = require('../views/descriptorvaluelist');
                    let DescriptorValuePairListView = require('../views/descriptorvaluepairlist');
                    let DescriptorValueOrdinalListView = require('../views/descriptorvalueordinallist');

                    if (model.get('format').type === "enum_single") {
                        valueListView = new DescriptorValueListView({
                            collection: collection,
                            model: model,
                        });

                    } else if (model.get('format').type === "enum_pair") {
                        valueListView = new DescriptorValuePairListView({
                            collection: collection,
                            model: model,
                        });

                    } else if (model.get('format').type === "enum_ordinal") {
                        valueListView = new DescriptorValueOrdinalListView({
                            collection: collection,
                            model: model,
                        });
                    }

                    if (valueListView) {

                        let contentBottomFooterLayout = new ContentBottomFooterLayout();
                        descriptorLayout.showChildView('values', contentBottomFooterLayout);

                        contentBottomFooterLayout.showChildView('content', valueListView);
                        contentBottomFooterLayout.showChildView('bottom', new ScrollingMoreView({
                            targetView: valueListView,
                            more: -1
                        }));
                    }
                });

                this.enableTabs();
            } else {
                this.disableValuesTab();
            }
        } else {
            // not available tabs
            this.disableValuesTab();
        }
    },
});

module.exports = Layout;
