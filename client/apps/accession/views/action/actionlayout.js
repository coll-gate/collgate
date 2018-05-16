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
        progression_tab: 'a[aria-controls=progression]',
        description: 'textarea[name=description]',
        action_type: 'input[name=action-type]',
        name: 'input[name=name]',
        username: 'input[name=username]',
        save: 'button[name=save]',
        steps_group: 'div[name=steps-group]',
        play_pause: 'button[name=toggle-auto]'
    },

    regions: {
        'general': "div.tab-pane[name=general]",
        'steps': "div.tab-pane[name=steps]",
        'steps-group': 'div[name=steps-group]',
        'progression': 'div[name=progression-content]'
    },

    events: {
        'click @ui.save': 'onSaveAction',
        'click @ui.play_pause': 'onTogglePlayPause'
    },

    // steps states consts
    STEP_INIT: 0,
    STEP_SETUP: 1,
    STEP_PROCESS: 2,
    STEP_DONE: 3,

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onActionCreate, this);
        } else {
            this.listenTo(this.model, 'change:data', this.onActionUpdate, this);
        }

        // naming options
        let self = this;
        let namingOptions = Object.resolve('data.naming_options', this.model.get('format')) || [];

        this.actionType = new ActionTypeModel({id: this.model.get('action_type')});
        this.actionTypePromise = this.actionType.fetch();

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

    onActionUpdate: function() {
        this.setupAllSteps(this.actionType.attributes);
    },

    enableTabs: function () {
        this.ui.steps_tab.parent().removeClass('disabled');
        this.ui.progression_tab.parent().removeClass('disabled');
    },

    disableStepsTab: function () {
        this.ui.steps_tab.parent().addClass('disabled');
    },

    disableProgressionTab: function () {
        this.ui.progression_tab.parent().addClass('disabled');
    },

    collapseStep: function (stepIndex, collapsed) {
        if (stepIndex < this.actionType.attributes['format']['steps'].length) {
            this.$el.find('#action_step' + stepIndex).collapse(collapsed ? 'hide' : 'show');
        }
    },

    setupProgression: function() {
        // @todo
    },

    setupStepData: function(stepIndex, stepFormat, readOnly) {
        if (stepFormat === null) {
            return;
        }

        let region = this.getRegion('step' + stepIndex);
        if (!region) {
            return;
        }

        region.$el.empty();

        let Element = window.application.accession.actions.getElement(stepFormat.id);
        if (Element && Element.ActionStepReadView && readOnly) {
            this.showChildView('step' + stepIndex, new Element.ActionStepReadView({
                model: this.model,
                namingOptions: this.namingOptions,
                namingFormat: this.namingFormat,
                stepIndex: stepIndex
            }));
        } else if (Element && Element.ActionStepProcessView && !readOnly) {
            let processView = new Element.ActionStepProcessView({
                model: this.model,
                namingOptions: this.namingOptions,
                namingFormat: this.namingFormat,
                stepIndex: stepIndex
            });

            this.showChildView('step' + stepIndex, processView);
            processView.showWorkingPanel(this.getRegion('progression'));
        } else {
            this.getRegion('progression').empty()
        }

        let iterative = false;

        if (Element) {
            let element = new Element();
            iterative = element.iterative;

            let descr = $('<div><p class="well well-sm" name="step-description">' + element.description + '</p></div>');
            region.$el.prepend(descr);
        }

        // according to the state of the step adapts the view
        let step = this.stepData(stepIndex);

        if (step && !readOnly) {
            let btnGroup = $('<div class="form-group text-center btn-group" role="group">');
            let resetBtn = $('<button type="button" name="step-reset" class="btn btn-warning btn-secondary"><span class="fa fa-eraser">&nbsp;</span>' + _t('Clear selections') + '</button>');
            let setupBtn = $('<button type="button" name="step-setup" class="btn btn-info btn-secondary"><span class="fa fa-upload">&nbsp;</span>' + _t('Setup selections') + '</button>');
            let iterateBtn = $('<button type="button" name="step-iterate" class="btn btn-success btn-secondary"><span class="fa fa-tasks">&nbsp;</span>' + _t('Progression') + '</button>');
            let processBtn = $('<button type="button" name="step-process" class="btn btn-success btn-secondary">' + _t('Realize') + '&nbsp;<span class="fa fa-step-forward"></span></button>');

            btnGroup.append(resetBtn).append(setupBtn);

            if (iterative) {
                btnGroup.append(iterateBtn);
            } else {
                btnGroup.append(processBtn);
            }

            if (step.state === this.STEP_INIT) {
                resetBtn.prop('disabled', true).removeClass('btn-warning');
                setupBtn.prop('disabled', false).addClass('btn-info').on('click', $.proxy(this.onSetupStepData, this));
                if (iterative) {
                    iterateBtn.prop('disabled', true).removeClass('btn-success');
                } else {
                    processBtn.prop('disabled', true).removeClass('btn-success');
                }
            } else if (step.state === this.STEP_SETUP) {
                resetBtn.prop('disabled', false).addClass('btn-warning').on('click', $.proxy(this.onResetStepData, this));
                setupBtn.prop('disabled', true).removeClass('btn-info');
                if (iterative) {
                    iterateBtn.prop('disabled', false).addClass('btn-success').on('click', $.proxy(this.onProcessIteration, this));
                } else {
                    processBtn.prop('disabled', false).addClass('btn-success').on('click', $.proxy(this.onProcessStep, this));
                }
            } else if (step.state === this.STEP_PROCESS) {
                resetBtn.prop('disabled', true).removeClass('btn-warning');
                setupBtn.prop('disabled', true).removeClass('btn-info');
                if (iterative) {
                    iterateBtn.prop('disabled', false).addClass('btn-success').on('click', $.proxy(this.onProcessIteration, this));
                } else {
                    processBtn.prop('disabled', false).addClass('btn-success').on('click', $.proxy(this.onProcessStep, this));
                }
            } else if (step.state === this.STEP_DONE) {
                resetBtn.prop('disabled', true).removeClass('btn-warning');
                setupBtn.prop('disabled', true).removeClass('btn-info');
                if (iterative) {
                    iterateBtn.prop('disabled', true).removeClass('btn-success');
                } else {
                    processBtn.prop('disabled', true).removeClass('btn-success');
                }
            }

            region.$el.append(btnGroup);
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
            let self = this;
            let step = this.stepData(this.currentStepIndex);

            if (step && step.state === this.STEP_SETUP) {
                this.model.save({action: 'reset'}, {wait: true, patch: true}).then(function () {
                    $.alert.success(_t("Successfully reset !"));
                    self.setupAllSteps(self.actionType.attributes);
                });
            }
        }
    },

    onSetupStepData: function() {
        // setup input to the current step
        if (this.currentStepIndex >= 0) {
            let self = this;

            let step = this.stepData(this.currentStepIndex);
            if (step && (step.state === this.STEP_SETUP || step.state === this.STEP_INIT)) {
                let child = this.getChildView('step' + this.currentStepIndex);

                let inputsType = child.inputsType();
                let inputsData = child.inputsData();
                let inputsColumns = child.inputsColumns();

                let data = {action: 'setup', inputs_type: inputsType};

                if (inputsType === "list") {
                    data.columns = inputsColumns;
                    data.list = inputsData;
                } else if (inputsType === "panel") {
                    data.panel = inputsData;
                } else if (inputsType === "upload") {
                }

                this.model.save(data, {wait: true, patch: true}).then(function () {
                    $.alert.success(_t("Successfully setup !"));
                    self.setupAllSteps(self.actionType.attributes);
                });
            }
        }
    },

    onProcessStep: function() {
        // store current step before changes to new current one
        if (this.currentStepIndex >= 0) {
            let self = this;

            let step = this.stepData(this.currentStepIndex);
            if (step && step.state === this.STEP_SETUP) {
                this.model.save({action: 'process'}, {wait: true, patch: true}).then(function (data) {
                    self.setupAllSteps(self.actionType.attributes);

                    if (data.data.steps[self.currentStepIndex].state === self.STEP_DONE) {
                        $.alert.success(_t("Successfully processed !"));

                        // collapse and style
                        let prev = self.ui.steps_group.find('div.panel[panel-id=' + self.currentStepIndex + ']').children('div.panel-heading');
                        prev.removeClass('action-current').addClass('action-done').parent().removeClass('panel-warning').addClass('panel-success');

                        self.collapseStep(self.currentStepIndex, true);
                        ++self.currentStepIndex;

                        let next = self.ui.steps_group.find('div.panel[panel-id=' + self.currentStepIndex + ']').children('div.panel-heading');
                        next.removeClass('action-next').addClass('action-current').parent().removeClass('panel-info').addClass('panel-warning');

                        self.collapseStep(self.currentStepIndex, false);
                    }
                });
            }
        }
    },

    onProcessIteration: function() {
        // store current step before changes to new current one
        if (this.currentStepIndex >= 0) {
            let self = this;

            let step = this.stepData(this.currentStepIndex);
            if (step && step.state === this.STEP_SETUP) {
                this.model.save({action: 'process'}, {wait: true, patch: true}).then(function () {
                    // show progression tab
                    self.setActiveTab("progression");
                    self.setupAllSteps(self.actionType.attributes);
                });
            } else if (step && step.state === this.STEP_PROCESS) {
                if (step.progression[0] < step.progression[1]) {
                    // show progression tab
                    self.setActiveTab("progression");
                } else {
                    // step is terminated
                    self.setupAllSteps(self.actionType.attributes);

                    // collapse and style
                    let prev = self.ui.steps_group.find('div.panel[panel-id=' + self.currentStepIndex + ']').children('div.panel-heading');
                    prev.removeClass('action-current').addClass('action-done').parent().removeClass('panel-warning').addClass('panel-success');

                    self.collapseStep(self.currentStepIndex, true);
                    ++self.currentStepIndex;

                    let next = self.ui.steps_group.find('div.panel[panel-id=' + self.currentStepIndex + ']').children('div.panel-heading');
                    next.removeClass('action-next').addClass('action-current').parent().removeClass('panel-info').addClass('panel-warning');

                    self.collapseStep(self.currentStepIndex, false);
                }
            }
        }
    },

    onProcessIterationItem: function() {
        // process one entry of the iteration


        // @todo
    },

    setupStructure: function(data) {
        let currentStepIndex = this.model.get('data').steps.length - 1;

        for (let i = 0; i < data.format.steps.length; ++i) {
            let panel = $('<div class="panel panel-default"></div>');
            panel.attr('panel-id', i);

            let heading = $('<div class="panel-heading" data-toggle="tooltip" data-placement="left" title="' + _t('Collapse/Expand') + '">');
            if (i === currentStepIndex && !this.model.get('completed')) {
                heading.addClass('action-current');
                panel.addClass('panel-warning');
            } else if (i < currentStepIndex || this.model.get('completed')) {
                heading.addClass('action-done');
                panel.addClass('panel-success');
            } else if (i > currentStepIndex) {
                heading.addClass('action-next');
                panel.addClass('panel-info');
            }
            panel.append(heading);

            let title = $('<a class="accordion-toggle" data-toggle="collapse" href="#action_step' + i + '"></a>');
            if (i !== currentStepIndex) {
                title.addClass('collapsed');
            }
            heading.append(title);

            let content = $('<div class="panel-collapse collapse"></div>');
            content.attr('id', 'action_step' + i);
            if (i === currentStepIndex) {
                content.addClass('in');
            } else {
                content.addClass('out');
            }
            content.append($('<div class="panel-body-no" style="margin: 15px;"></div>'));
            panel.append(content);

            this.ui.steps_group.append(panel);
            this.addRegion('step' + i, '#action_step' + i + ' > div');

            let currentStepFormat = data.format.steps[i];
            if (currentStepFormat !== null) {
                let stepFormat = window.application.accession.collections.actionStepFormats.findWhere({id: currentStepFormat.type});
                let suffix = i === currentStepIndex ? _t("current") : i < currentStepIndex ? _t("done") : _t("to be done");

                title.text((i+1) + " - " + stepFormat.get('label') + " (" + suffix + ")" );
            }
        }

        this.currentStepIndex = currentStepIndex;
    },

    setupAllSteps: function(data) {
        let currentStepIndex = this.model.get('data').steps.length - 1;

        for (let i = 0; i < data.format.steps.length; ++i) {
            let currentStepFormat = data.format.steps[i];
            if (currentStepFormat !== null) {
                let stepFormat = window.application.accession.collections.actionStepFormats.findWhere({id: currentStepFormat.type});
                this.setupStepData(i, stepFormat, i !== currentStepIndex);
            }
        }
    },

    onRender: function () {
        let actionLayout = this;

        // creator user name
        let username = this.model.get('user');

        this.actionTypePromise.then(function (data) {
            actionLayout.ui.action_type.val(data.label);
        });

        this.ui.description.val(this.model.get('description'));

        if (this.model.isNew()) {
            if (!username) {
                username = window.session.user.username;
            }

            // not available tabs
            this.disableStepsTab();
            this.disableProgressionTab();
        } else {
            this.actionTypePromise.then(function (data) {
                actionLayout.ui.action_type.val(data.label);

                actionLayout.setupStructure(data);
                actionLayout.setupAllSteps(data);

                actionLayout.enableTabs();
            });
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
    }
});

module.exports = Layout;
