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

let Layout = LayoutView.extend({
    template: require("../templates/descriptorlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        configuration_tab: 'a[aria-controls=configuration]',
        values_tab: 'a[aria-controls=values]',
        format_type: 'select.batch-action-type-format-type',
        description: 'textarea[name=description]',
        config_save: 'button[name=save]'
    },

    regions: {
        // 'contextual': "div.contextual-region",
        'configuration': "div.tab-pane[name=configuration]",
        'values': "div.tab-pane[name=values]"
    },

    events: {
        'change @ui.format_type': 'changeFormatType',
        'click @ui.config_save': 'onUpdateConfig'
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
            /*trigger: true,*/
            replace: false
        });
    },

    disableValuesTab: function () {
        this.ui.values_tab.parent().addClass('disabled');
    },

    enableTabs: function () {
        this.ui.values_tab.parent().removeClass('disabled');
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
        let descriptorLayout = this;

        // window.application.accession.views.batchActionTypeFormats.drawSelect(
        //     this.ui.format_type, true, false, format.type || 'creation');

        // configuration tab
        let descriptorDetails = new DescriptorDetails({model: this.model});
        descriptorLayout.showChildView('configuration', descriptorDetails);

        if (!this.model.isNew()) {
            this.enableTabs();
        } else {
            // not available tabs
            this.disableValuesTab();
        }
    },

    onUpdateConfig: function () {
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
