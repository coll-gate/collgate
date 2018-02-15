/**
 * @file actionlayout.js
 * @brief Optimized layout for action details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-02-13
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../../main/views/layout');
let ActionModel = require('../../models/action');
let ScrollingMoreView = require('../../../main/views/scrollingmore');
let ContentBottomLayout = require('../../../main/views/contentbottomlayout');

let Layout = LayoutView.extend({
    template: require("../../templates/action/actionlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        general_tab: 'a[aria-controls=general]',
        steps_tab: 'a[aria-controls=steps]',
        entities: 'a[aria-controls=entities]',
        description: 'textarea[name=description]',
        name: 'input[name=name]',
        username: 'input[name=username]',
        save: 'button[name=save]',
        step_index: 'select.action-type-step-index',
        process_step: 'button[name=process-step]'
    },

    regions: {
        'general': "div.tab-pane[name=general]",
        'steps': "div.tab-pane[name=steps]",
        'contextual': "div.contextual-region"
    },

    events: {
        'click @ui.save': 'onSaveAction',
        'click @ui.process_step': 'onProcessStep'
    },

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onActionCreate, this);
        }

        // naming options
        let self = this;
        let namingOptions = Object.resolve('data.naming_options', this.model.get('format')) || [];

        this.namingOptions = null;
        this.namingFormat = null;
        this.currentStepIndex = -1;

        self.namingOptionsPromise = $.ajax({
            type: "GET",
            url: window.application.url(['accession', 'naming', 'batch']),
            dataType: 'json',
        }).done(function(data) {
            let len = (data.format.match(/{CONST}/g) || []).length;

            if (namingOptions.length !== len) {
                namingOptions = new Array(len);
            }

            self.namingOptions = namingOptions;
            self.namingFormat = data.format;
        });
    },

    onActionCreate: function () {
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

    loadCurrentStepData: function() {
        // if (this.currentStepIndex >= 0) {
        //     let stepData = this.model.get('format')['steps'][this.currentStepIndex];
        //     this.ui.step_format.val(stepData.type).prop('disabled', false).selectpicker('refresh');
        //
        //     let Element = window.application.accession.actions.getElement(stepData.type);
        //     let actionFormatType = new Element.ActionStepFormatDetailsView({
        //         model: this.model,
        //         namingOptions: this.namingOptions,
        //         namingFormat: this.namingFormat,
        //         stepIndex: this.currentStepIndex
        //     });
        //
        //     this.showChildView('contextual', actionFormatType);
        // }
    },

    onProcessStep: function() {
        // store current step before changes to new current one
        if (this.currentStepIndex >= 0) {
            // this.getChildView('contextual').storeData();
        }
    },

    changeStep: function () {
        let format = this.model.get('format');
        let idx = parseInt(this.ui.step_index.val());

        if (idx < 0) {
            // create a new one
            if (format['steps'].length >= 10) {
                $.alert.warning(_t("Max number of step reached (10)"));
                return;
            } else {
                let nextIdx = format.steps.length;
                let formatType = this.ui.step_format.val();

                let stepData = {
                   'index': nextIdx,
                   'type': 'accession_list'
                };

                let element = window.application.accession.actions.newElement(formatType);
                if (element) {
                    stepData = element.defaultFormat();
                }

                stepData.index = nextIdx;
                stepData.type = formatType;

                // initial step data
                this.model.get('format')['steps'].push(stepData);

                this.ui.step_index
                    .append('<option value="' + nextIdx + '">' + _t("Step") + " " + nextIdx + '</option>')
                    .val(nextIdx)
                    .selectpicker('refresh');

                this.ui.step_format.prop('disabled', false).selectpicker('refresh');
                idx = nextIdx;
            }
        }

        // set into the model
        this.storeCurrentStepData();

        this.currentStepIndex = idx;
        this.loadCurrentStepData();
    },

    disableStepsTab: function () {
        this.ui.steps_tab.parent().addClass('disabled');
    },

    onRender: function () {
        let format = this.model.get('format');
        let actionLayout = this;

        // creator user name
        let username = this.model.get('user');

        if (!this.model.isNew()) {
            let currentStepIndex = this.model.get('data').steps.length;

            let previousStep = currentStepIndex > 1 ? this.model.get('data').steps[currentStepIndex-1] : null;
            let currentStep = currentStepIndex > 0 ? this.model.get('data').steps[currentStepIndex] : null;

            if (currentStep) {
                // @todo
            }

            this.enableTabs();
        } else {
            if (!username) {
                username = window.session.user.username;
            }

            // not available tabs
            this.disableStepsTab();
        }

        $.ajax({
            type: "GET",
            url: window.application.url(['permission', 'user', 'username', username]),
            dataType: 'json'
        }).done(function (data) {
            let name = [data.first_name, data.last_name, '(' + data.username + ')'];
            actionLayout.ui.username.val(name.join(' '));
        });
    },

    onBeforeDetach: function () {
    },

    onSaveAction: function() {
        let name = this.ui.name.val().trim();
        let description = this.ui.description.val().trim();
        let actionType = parseInt(this.model.get('action_type'));

        // update action info data
        let model = this.model;

        if (model.isNew()) {
            model.save({name: name, description: description, action_type: actionType}, {wait: true}).then(function () {
                $.alert.success(_t("Successfully created !"));
                Backbone.history.navigate('app/accession/action/' + model.get('id') + '/', {trigger: true, replace: true});
            });
        } else {
            model.save({name: name, description: description}, {wait: true, patch: true}).then(function () {
                $.alert.success(_t("Successfully changed !"));
                Backbone.history.navigate('app/accession/action/' + model.get('id') + '/', {trigger: true, replace: true});
            });
        }
    }
});

module.exports = Layout;
