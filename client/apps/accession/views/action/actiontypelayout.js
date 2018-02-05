/**
 * @file actiontypelayout.js
 * @brief Optimized layout for action details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../../main/views/layout');
let ActionTypeModel = require('../../models/actiontype');
let ScrollingMoreView = require('../../../main/views/scrollingmore');
let ContentBottomLayout = require('../../../main/views/contentbottomlayout');

let Layout = LayoutView.extend({
    template: require("../../templates/actiontype/layout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        general_tab: 'a[aria-controls=general]',
        steps_tab: 'a[aria-controls=steps]',
        format_type: 'select.action-type-format-type',
        description: 'textarea[name=description]',
        config_save: 'button[name=save]'
    },

    regions: {
        'contextual': "div.contextual-region",
        'namingOptions': "div.naming-options",
        'general': "div.tab-pane[name=general]",
        'steps': "div.tab-pane[name=steps]",
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
        Backbone.history.navigate('app/accession/actiontype/' + this.model.get('id') + '/', {
            /*trigger: true,*/
            replace: false
        });
    },

    enableTabs: function () {
        this.ui.steps_tab.parent().removeClass('disabled');
    },

    changeFormatType: function () {
        let formatType = this.ui.format_type.val();

        // update the contextual region according to the format
        let Element = window.application.accession.actions.getElement(formatType);
        if (Element && Element.ActionStepFormatDetailsView) {
            this.showChildView('contextual', new Element.ActionStepFormatDetailsView({model: this.model}));
        } else {
            this.getRegion('contextual').empty();
        }
    },

    onRender: function () {
        let format = this.model.get('format');
        let batchLayout = this;

        window.application.accession.views.actionTypeFormats.drawSelect(
            this.ui.format_type, true, false, format.type || 'creation');

        if (!this.model.isNew()) {
            // configuration tab
            // let Element = window.application.accession.actions.getElement(format.type || 'creation');
            // let actionFormatType = new Element.ActionStepFormatDetailsView({model: this.model});
            // this.ui.format_type.prop('disabled', true).selectpicker('refresh');
            //
            // batchLayout.showChildView('contextual', actionFormatType);

            this.enableTabs();
        } else {
            let Element = window.application.accession.actions.getElement(format.type || 'creation');
            let actionFormatType = new Element.ActionStepFormatDetailsView({model: this.model});

            batchLayout.showChildView('contextual', actionFormatType);
        }

        // naming options
        let self = this;

        // @todo move to steps
        let namingOptions = Object.resolve('data.naming_options', this.model.get('format')) || [];

        $.ajax({
            type: "GET",
            url: window.application.url(['accession', 'naming', 'batch']),
            dataType: 'json',
        }).done(function(data) {
            let NamingOptionsView = require('../namingoption');
            let len = (data.format.match(/{CONST}/g) || []).length;

            if (namingOptions.length !== len) {
                namingOptions = new Array(len);
            }

            self.showChildView("namingOptions", new NamingOptionsView({
                namingFormat: data.format,
                namingOptions: namingOptions
            }));
        });
    },

    onUpdateConfig: function() {
        let childView = this.getChildView('contextual');
        let namingOptionsView = this.getChildView('namingOptions');
        let formatType = this.ui.format_type.val();

        if (childView) {
            let format = {
                type: formatType,
                data: childView.getFormat() || {}
            };

            if (namingOptionsView) {
                format.data['naming_options'] = namingOptionsView.getNamingOptions();
            }

            let description = this.ui.description.val();
            let model = this.model;

            if (model.isNew()) {
                model.save({description: description, format: format}, {wait: true}).then(function () {
                    $.alert.success(_t("Successfully changed !"));
                    Backbone.history.navigate('app/accession/actiontype/' + model.get('id') + '/', {trigger: true, replace: true});
                });
            } else {
                model.save({description: description, format: format}, {wait: true, patch: true}).then(function () {
                    $.alert.success(_t("Successfully changed !"));
                    Backbone.history.navigate('app/accession/actiontype/' + model.get('id') + '/', {trigger: true, replace: true});
                });
            }
        }
    }
});

module.exports = Layout;
