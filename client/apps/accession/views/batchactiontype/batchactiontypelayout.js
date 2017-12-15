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
        configuration_tab: 'a[aria-controls=configuration]',
        accessions_tab: 'a[aria-controls=accessions]',
        format_type: 'select.batch-action-type-format-type'
    },

    regions: {
        'contextual': "div.contextual-region",
        'accessions': "div.tab-pane[name=accessions]"
    },

    events: {
        'change @ui.format_type': 'changeFormatType'
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
        Backbone.history.navigate('app/accession/batchactiontype/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },

    disableAccessionsTab: function () {
        this.ui.accessions_tab.parent().addClass('disabled');
    },

    enableTabs: function () {
        this.ui.accessions_tab.parent().removeClass('disabled');
    },

    changeFormatType: function () {
        let type = this.ui.format_type.val();

        // update the contextual region according to the format
        let Element = window.application.accession.actions.getElement(type);
        if (Element && Element.BatchActionTypeFormatDetailsView) {
            this.showChildView('contextual', new Element.BatchActionTypeFormatDetailsView({model: this.model}));
        } else {
            this.getRegion('contextual').empty();
        }
    },

    onRender: function () {
        let format = this.model.get('format');
        let batchLayout = this;

        application.accession.views.batchActionTypeFormats.drawSelect(this.ui.format_type, true, false, format.type || 'creation');

        if (!this.model.isNew()) {
            // configuration tab
            let BatchActionFormatType = window.application.accession.actions.getElement(format.type || 'creation');
            let batchActionFormatType = new BatchActionFormatType.BatchActionTypeFormatDetailsView({model: this.model});

            batchLayout.showChildView('contextual', batchActionFormatType);

            this.enableTabs();
        } else {
            let BatchActionFormatType = window.application.accession.actions.getElement(format.type || 'creation');
            let batchActionFormatType = new BatchActionFormatType({model: this.model});

            batchLayout.showChildView('contextual', batchActionFormatType);

            // not available tabs
            disableAccessionsTab();
        }
    }
});

module.exports = Layout;
