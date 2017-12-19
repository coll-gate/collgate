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

let Layout = LayoutView.extend({
    template: require("../../templates/batchactiontype/layout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        configuration_tab: 'a[aria-controls=configuration]',
        accessions_tab: 'a[aria-controls=accessions]',
        format_type: 'select.batch-action-type-format-type',
        description: 'textarea[name=description]',
        config_save: 'button[name=save]'
    },

    regions: {
        'contextual': "div.contextual-region",
        'configuration': "div.tab-pane[name=configuration]",
        'accessions': "div.tab-pane[name=accessions]"
    },

    events: {
        'change @ui.format_type': 'changeFormatType',
        'click @ui.config_save': 'onUpdateConfig'
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
        let formatType = this.ui.format_type.val();

        // update the contextual region according to the format
        let Element = window.application.accession.actions.getElement(formatType);
        if (Element && Element.BatchActionTypeFormatDetailsView) {
            this.showChildView('contextual', new Element.BatchActionTypeFormatDetailsView({model: this.model}));
        } else {
            this.getRegion('contextual').empty();
        }
    },

    onRender: function () {
        let format = this.model.get('format');
        let batchLayout = this;

        window.application.accession.views.batchActionTypeFormats.drawSelect(
            this.ui.format_type, true, false, format.type || 'creation');

        if (!this.model.isNew()) {
            // configuration tab
            let Element = window.application.accession.actions.getElement(format.type || 'creation');
            let batchActionFormatType = new Element.BatchActionTypeFormatDetailsView({model: this.model});
            this.ui.format_type.prop('disabled', true).selectpicker('refresh');

            batchLayout.showChildView('contextual', batchActionFormatType);

            this.enableTabs();
        } else {
            let Element = window.application.accession.actions.getElement(format.type || 'creation');
            let batchActionFormatType = new Element.BatchActionTypeFormatDetailsView({model: this.model});

            batchLayout.showChildView('contextual', batchActionFormatType);

            // not available tabs
            this.disableAccessionsTab();
        }
    },

    onUpdateConfig: function() {
        let childView = this.getChildView('contextual');
        let formatType = this.ui.format_type.val();

        if (childView) {
            let format = childView.getFormat();
            format.type = formatType;

            let description = this.ui.description.val();
            let model = this.model;

            if (model.isNew()) {
                model.save({description: description, format: format}, {wait: true}).then(function () {
                    //Backbone.history.navigate('app/accession/batchactiontype/' + model.get('id') + '/', {trigger: true, replace: true});
                });
            } else {
                model.save({description: description}, {wait: true, patch: true}).then(function () {
                    //Backbone.history.navigate('app/accession/batchactiontype/' + model.get('id') + '/', {trigger: true, replace: true});
                });
            }
        }
    }
});

module.exports = Layout;
