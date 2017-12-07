/**
 * @file batchactiontypelayout.js
 * @brief Optimized layout for batch action details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../../main/views/layout');
let BatchActionTypeModel = require('../../models/batchactiontype');
let ScrollingMoreView = require('../../../main/views/scrollingmore');
let ContentBottomLayout = require('../../../main/views/contentbottomlayout');
// let BatchDescriptorEditView = require('./batchactiontypeedit');

let Layout = LayoutView.extend({
    template: require("../../templates/batchactiontype/layout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        configuration_tab: 'a[aria-controls=configuration]'
    },

    regions: {
        'configuration': "div.tab-pane[name=configuration]"
    },

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onBatchActionTypeCreate, this);
        }
    },

    onBatchActionTypeCreate: function () {
        // re-render once created
        this.render();

        // and update history
        Backbone.history.navigate('app/accession/batch-action-type/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },

    enableTabs: function () {
    },

    onRender: function () {
        let batchLayout = this;

        if (!this.model.isNew()) {
            // configuration tab
            // let configurationView = new (); @todo from model manager
            // batchLayout.showChildView('configuration', configurationView);

            this.enableTabs();
        } else {
            // let configurationView = new (); @todo from model manager
            // batchLayout.showChildView('configuration', configurationView);

            // not availables tabs
        }
    }
});

module.exports = Layout;
