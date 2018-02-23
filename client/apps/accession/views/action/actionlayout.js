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
let ActionTypeModel = require('../../models/actiontype');
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
        action_type: 'input[name=action-type]',
        name: 'input[name=name]',
        username: 'input[name=username]',
        save: 'button[name=save]',
        step_index: 'select[name=step-index]',
        step_format: 'input[name=step-format]',
        step_reset: 'button[name=step-reset]',
        step_setup: 'button[name=step-setup]',
        step_continue: 'button[name=step-continue]',
        step_description: 'p[name=step-description]'
    },

    regions: {
        'general': "div.tab-pane[name=general]",
        'steps': "div.tab-pane[name=steps]",
        'contextual': "div.contextual-region"
    },

    events: {
        'click @ui.save': 'onSaveAction',
        'click @ui.step_reset': 'onResetStepData',
        'click @ui.step_setup': 'onSetupStepData',
        'click @ui.step_continue': 'onProcessStep',
        'change @ui.step_index': 'onChangeStepIndex'
    },

    // steps states consts
    STEP_INIT: 0,
    STEP_SETUP: 1,
    STEP_DONE: 2,

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onActionCreate, this);
        }

        this.listenTo(this.model, 'change', this.onRender, this);

        // naming options
        let self = this;
        let namingOptions = Object.resolve('data.naming_options', this.model.get('format')) || [];

        this.actionType = new ActionTypeModel({id: this.model.get('action_type')});
        this.actionTypePromise = this.actionType.fetch();

        this.namingOptions = null;
        this.namingFormat = null;
        this.currentStepIndex = -1;
        this.currentStepState = 0;

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

    displayStepData: function(stepIndex, stepFormat, readOnly) {
        if (stepFormat === null) {
            return;
        }

        // according to the state of the step adapts the view
        let step = this.stepData(stepIndex);
        if (step) {
            if (step.state === this.STEP_INIT) {
                this.ui.step_reset.prop('disabled', true).removeClass('btn-warning');
                this.ui.step_setup.prop('disabled', false).addClass('btn-info');
                this.ui.step_continue.prop('disabled', true).removeClass('btn-success');
            } else if (step.state === this.STEP_SETUP) {
                this.ui.step_reset.prop('disabled', false).addClass('btn-warning');
                this.ui.step_setup.prop('disabled', false).addClass('btn-info');
                this.ui.step_continue.prop('disabled', false).addClass('btn-success');
            } else if (step.state === this.STEP_DONE) {
                this.ui.step_reset.prop('disabled', true).removeClass('btn-warning');
                this.ui.step_setup.prop('disabled', true).removeClass('btn-info');
                this.ui.step_continue.prop('disabled', true).removeClass('btn-success');
            }
        }

        this.ui.step_index.selectpicker('val', stepIndex);
        this.ui.step_format.val(stepFormat.get('label'));

        let Element = window.application.accession.actions.getElement(stepFormat.id);
        if (Element) {
            this.ui.step_description.text(new Element().description);
        } else {
            this.ui.step_description.text("");
        }

        if (Element && Element.ActionStepProcessView) {
            this.showChildView('contextual', new Element.ActionStepProcessView({
                model: this.model,
                readonly: readOnly,
                namingOptions: this.namingOptions,
                namingFormat: this.namingFormat,
                stepIndex: stepIndex
            }));
        } else {
            this.getRegion('contextual').empty();
        }
    },

    stepData: function(stepIndex) {
        let steps = this.model.get('data')['steps'];

          if (stepIndex < 0 || stepIndex >= steps.length) {
              return null;
          }

          return steps[stepIndex];
    },

    onResetStepData: function() {
        // reset previously setup data on the current step
        if (this.currentStepIndex >= 0) {
            let step = this.stepData(this.currentStepIndex);

            if (step && step.state === this.STEP_SETUP) {
                this.model.save({action: 'reset'}, {wait: true, patch: true}).then(function () {
                    $.alert.success(_t("Successfully reset !"));
                });
            }
        }
    },

    onSetupStepData: function() {
        // setup input to the current step
        if (this.currentStepIndex >= 0) {
            let step = this.stepData(this.currentStepIndex);
            if (step && (step.state === this.STEP_SETUP || step.state === this.STEP_INIT)) {
                let inputsType = this.getChildView('contextual').inputsType();
                let inputsData = this.getChildView('contextual').inputsData();
                let data = {action: 'setup', inputs_type: inputsType};

                if (inputsType === "list") {
                    data.list = inputsData;
                } else if (inputsType === "panel") {
                    data.panel = inputsData;
                } else if (inputsType === "upload") {
                    data.upload = inputsData; // @todo upload the document or manage it by the client
                }

                this.model.save(data, {wait: true, patch: true}).then(function () {
                    $.alert.success(_t("Successfully setup !"));
                });
            }
        }
    },

    onProcessStep: function() {
        // store current step before changes to new current one
        if (this.currentStepIndex >= 0) {
            let step = this.stepData(this.currentStepIndex);
            if (step && step.state === this.STEP_SETUP) {
                this.model.save({action: 'process'}, {wait: true, patch: true}).then(function () {
                    $.alert.success(_t("Successfully processed !"));
                });
            }
        }
    },

    disableStepsTab: function () {
        this.ui.steps_tab.parent().addClass('disabled');
    },

    onRender: function () {
        let actionLayout = this;

        // creator user name
        let username = this.model.get('user');

        this.actionTypePromise.then(function (data) {
            actionLayout.ui.action_type.val(data.label);
        });

        if (!this.model.isNew()) {
            let steps = this.model.get('data').steps;

            for (let i = 0; i < steps.length; ++i) {
                let label =  _t("Step") + " " + i ;
                if (steps[i].state === this.STEP_DONE) {
                    label += " " + _t("(done)");
                } else if (i+1 === steps.length) {
                    label += " " + _t("(current)");
                }

                this.ui.step_index.append('<option value="' + i + '">' + label + '</option>');
            }

            this.ui.step_index.selectpicker({});

            this.actionTypePromise.then(function (data) {
                let currentStepIndex = actionLayout.model.get('data').steps.length - 1;
                let currentStepData = currentStepIndex > 0 ? actionLayout.model.get('data').steps[currentStepIndex] : null;
                let currentStepFormat = null;

                if (currentStepData && currentStepData.done) {
                    // init the next step if not the last
                    if (currentStepIndex + 1 < data.steps.length) {
                        ++currentStepIndex;
                        currentStepFormat = data.format.steps[currentStepIndex];
                    }
                } else if (currentStepData) {
                    // display the current step
                    currentStepFormat = data.format.steps[currentStepIndex];
                    // @todo
                } else if (data.format.steps.length) {
                    // initiate the first step
                    currentStepIndex = 0;
                    currentStepFormat = data.format.steps[0];
                }

                for (let i = 0; i < currentStepIndex+1; ++i) {
                    actionLayout.ui.step_index.append('<option value="' + i + '">' + _t("Step") + " " + i + '</option>');
                }

                actionLayout.ui.step_index.selectpicker({});
                if (currentStepFormat !== null) {
                    let stepFormat = window.application.accession.collections.actionStepFormats.findWhere({id: currentStepFormat.type});
                    actionLayout.displayStepData(currentStepIndex, stepFormat, false);
                }

                actionLayout.currentStepIndex = currentStepIndex;
            });

            this.enableTabs();
        } else {
            if (!username) {
                username = window.session.user.username;
            }

            // not available tabs
            this.disableStepsTab();
        }

        // display complete username
        $.ajax({
            type: "GET",
            url: window.application.url(['permission', 'user', 'username', username]),
            dataType: 'json'
        }).done(function (data) {
            let name = [data.first_name, data.last_name, '(' + data.username + ')'];
            $(actionLayout.ui.username).val(name.join(' '));
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
            model.save({name: name, description: description}, {wait: true, patch: false}).then(function () {
                $.alert.success(_t("Successfully changed !"));
                Backbone.history.navigate('app/accession/action/' + model.get('id') + '/', {trigger: true, replace: true});
            });
        }
    },

    onChangeStepIndex: function() {
        let stepIndex = parseInt(this.ui.step_index.val());
        let currentStepFormat = this.actionType.get('format').steps[stepIndex];
        let stepFormat = window.application.accession.collections.actionStepFormats.findWhere({id: currentStepFormat.type});

        this.displayStepData(stepIndex, stepFormat, this.model.get('completed'));
    }
});

module.exports = Layout;
