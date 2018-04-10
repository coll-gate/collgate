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
let Dialog = require('../../../main/views/dialog');

let Layout = LayoutView.extend({
    template: require("../../templates/action/actiontypelayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
        general_tab: 'a[aria-controls=general]',
        steps_tab: 'a[aria-controls=steps]',
        name: 'input[name=name]',
        description: 'textarea[name=description]',
        config_save: 'button[name=save]',
        steps_group: 'div[name=steps-group]',
        delete_step: 'span[name=delete-step]',
        step_description: 'p[name=step-description]',
        add_step: 'div.panel-ghost'
    },

    regions: {
        'general': "div.tab-pane[name=general]",
        'steps': "div.tab-pane[name=steps]",
        'steps-group': 'div[name=steps-group]',
        'contextual': "div.contextual-region"
    },

    events: {
        'click @ui.config_save': 'onUpdateConfig',
        'click @ui.delete_step': 'onDeleteStep',
        'click @ui.add_step': 'onAddStep'
    },

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onActionTypeCreate, this);
        }

        // naming options
        let self = this;
        let namingOptions = Object.resolve('data.naming_options', this.model.get('format')) || [];

        this.namingOptions = null;
        this.namingFormat = null;

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

    onActionTypeCreate: function () {
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

    storeStepData: function(stepIndex) {
        // retrieve step data from a specific step model and store it into this model
        this.getChildView('step' + stepIndex).storeData();
    },

    setupStructure: function(steps) {
        for (let i = 0; i < steps.length; ++i) {
            this.appendStepStructure(i !== 0);
        }
    },

    setupAllSteps: function(steps) {
        for (let i = 0; i < steps.length; ++i) {
            let step = steps[i];
            if (step !== null) {
                this.setupStepData(i, step);
            }
        }
    },

    setupStepData: function(stepIndex, stepData) {
        if (stepData === null) {
            return;
        }

        let region = this.getRegion('step' + stepIndex);
        if (!region) {
            return;
        }

        region.$el.empty();

        let Element = window.application.accession.actions.getElement(stepData.type);
        if (Element && Element.ActionStepFormatDetailsView) {
            this.showChildView('step' + stepIndex, new Element.ActionStepFormatDetailsView({
                model: this.model,
                namingOptions: this.namingOptions,
                namingFormat: this.namingFormat,
                stepIndex: stepIndex
            }));
        }

        if (Element) {
            let descr = $('<div><p class="well well-sm" name="step-description">' + new Element().description + '</p></div>');
            region.$el.prepend(descr);

            let stepFormat = window.application.accession.collections.actionStepFormats.findWhere({id: stepData.type});
            this.$el.find('div[panel-id=' + stepIndex + ']').find('span[name=step-label]').text((stepIndex+1) + " - " + stepFormat.get('label'));
        }
    },

    appendStepStructure: function(collapsed) {
        let self = this;
        let i = this.ui.steps_group.children('div.panel').length;

        let panel = $('<div class="panel panel-default" style="margin: 10px 0px;"></div>');
        panel.attr('panel-id', i);

        let heading = $('<div class="panel-heading unselectable current" data-toggle="tooltip" data-placement="left" title="' + _t('Collapse/Expand') + '">');
        panel.append(heading);

        // heading title
        let title = $('<span name="step-label" class="action"></span>').on('click', function() {
            self.onChangeFormatType(parseInt(panel.attr('panel-id')));
        });
        heading.append(title);

        // collapse button and options dropdown
        let helpers = $('<div class="pull-right"><div class="btn-group btn-group-sm"><a class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="action fa fa-lg fa-cog" style="color: gray"></span></a></div><a class="accordion-toggle" data-toggle="collapse" href="#action_step' + i + '" style="margin-left: 20px;"></a></div>');
        if (collapsed) {
            helpers.find('a.accordion-toggle').addClass('collapsed');
        }

        let ul = $('<ul class="dropdown-menu dropdown-menu-right">');

        helpers.children('div.btn-group').append(ul);
        ul.append($('<li><a class="action step-format">' + _t("Change format") + '</a></li>').on('click', function() {
            // from attr because can change during remove
            self.onChangeFormatType(parseInt(panel.attr('panel-id')));
        }));
        ul.append($('<li role="separator" class="divider"></li>'));
        ul.append($('<li><a class="action delete-step">' + _t("Remove") + '</a></li>').on('click', function() {
            self.onDeleteStep(parseInt(panel.attr('panel-id')));
        }));

        heading.append(helpers);

        // toggle collapse on double click on heading
        heading.on('dblclick', function(e) {
            heading.parent().children('div.panel-collapse').collapse('toggle');
            return true;
        });

        // collapse-able inner part
        let panelCollapse = $('<div class="panel-collapse collapse"></div>');
        panelCollapse.attr('id', 'action_step' + i);
        if (!collapsed) {
            panelCollapse.addClass('in');
        }
        panel.append(panelCollapse);

        // panel-body make an expand issue so don't use it... it is the content part related to the dynamic region
        let content = $('<div class="panel-body-no" style="margin: 10px;"></div>');
        panelCollapse.append(content);

        this.ui.steps_group.append(panel);
        this.addRegion('step' + i, '#action_step' + i + ' > div');
    },

    addStepData: function(stepFormat) {
        if (stepFormat) {
            let i = this.model.get('format').steps.length;
            this.appendStepStructure(false);

            let stepData = {};

            let element = window.application.accession.actions.newElement(stepFormat);
            if (element) {
                stepData = element.defaultFormat();
            }

            stepData.index = i;
            stepData.type = stepFormat;

            this.model.get('format').steps.push(stepData);
            this.setupStepData(i, stepData);
        }
    },

    onRender: function () {
        let actionTypeLayout = this;

        if (actionTypeLayout.model.isNew()) {
            this.disableStepsTab();
        } else {
            this.namingOptionsPromise.then(function() {
                let data = actionTypeLayout.model.get('format').steps;

                actionTypeLayout.setupStructure(data);
                actionTypeLayout.setupAllSteps(data);

                actionTypeLayout.enableTabs();
            });
        }
    },

    onBeforeDetach: function () {
    },

    onUpdateConfig: function() {
        let name = this.ui.name.val().trim();
        let description = this.ui.description.val().trim();

        let model = this.model;
        let format = model.get('format');

        // store possible last changes on current step
        for (let i = 0; i < format.steps.length; ++i) {
            this.storeStepData(i);
        }

        if (model.isNew()) {
            model.save({name: name, description: description, format: format}, {wait: true}).then(function () {
                $.alert.success(_t("Successfully changed !"));
                Backbone.history.navigate('app/accession/actiontype/' + model.get('id') + '/', {trigger: true, replace: true});
            });
        } else {
            model.save({name: name, description: description, format: format}, {wait: true, patch: true}).then(function () {
                $.alert.success(_t("Successfully changed !"));
                Backbone.history.navigate('app/accession/actiontype/' + model.get('id') + '/', {trigger: true, replace: true});
            });
        }
    },

    onChangeFormatType: function (stepIndex) {
        let ChangeStepDialog = Dialog.extend({
            template: require('../../templates/action/actiontypestepchange.html'),

            ui: {
                step_format: 'select[name=step-format]',
                change_btn: 'button.change'
            },

            events: {
                'click @ui.change_btn': 'onChange'
            },

            triggers: {
                "click @ui.change_btn": "step:change",
            },

            initialize: function (options) {
                ChangeStepDialog.__super__.initialize.apply(this, arguments);
            },

            onRender: function () {
                ChangeStepDialog.__super__.onRender.apply(this);

                window.application.accession.views.actionStepFormats.drawSelect(this.ui.step_format, true, false);
            },

            onBeforeDestroy: function () {
                this.ui.step_format.selectpicker('destroy');

                ChangeStepDialog.__super__.onBeforeDestroy.apply(this);
            },

            onChange: function () {
            }

        });

        let self = this;
        let changeStepDialog = new ChangeStepDialog({
            model: this.model
        });
        changeStepDialog.on('step:change', function () {
            self.changeStepFormat(stepIndex, changeStepDialog.ui.step_format.val());
            changeStepDialog.destroy();
        });
        changeStepDialog.render();
    },

    changeStepFormat: function(stepIndex, stepFormat) {
        let stepData = {};

        let element = window.application.accession.actions.newElement(stepFormat);
        if (element) {
            stepData = element.defaultFormat();
        }

        stepData.index = stepIndex;
        stepData.type = stepFormat;

        this.model.get('format').steps[stepIndex] = stepData;
        if (stepData !== null) {
            this.setupStepData(stepIndex, stepData);
        }
    },

    onDeleteStep: function (stepIndex) {
        let steps = this.model.get('format').steps;
        let stepsCount = steps.length;

        steps.splice(stepIndex, 1);

        // clear the step region
        this.getRegion('step' + stepIndex).$el.find('div.step-description').remove();
        this.getRegion('step' + stepIndex).empty();

        // shift from top any below steps
        let newI = stepIndex;
        for (let oldI = stepIndex+1; oldI < stepsCount; ++oldI) {
            let oldRegionName = 'step' + oldI;

            this.getRegion(oldRegionName).$el.find('div.step-description').remove();
            this.getRegion(oldRegionName).empty();

            this.setupStepData(newI, steps[newI]);

            ++newI;
        }

        // remove the last remaining step
        this.removeRegion('step' + newI);
        this.ui.steps_group.children('div[panel-id=' + newI + ']').remove();
    },

    onAddStep: function() {
        let AddStepDialog = Dialog.extend({
            template: require('../../templates/action/actiontypestepcreate.html'),

            ui: {
                step_format: 'select[name=step-format]',
                create_btn: 'button.create'
            },

            events: {
                'click @ui.create_btn': 'onCreate'
            },

            triggers: {
                "click @ui.create_btn": "step:create",
            },

            initialize: function (options) {
                AddStepDialog.__super__.initialize.apply(this, arguments);
            },

            onRender: function () {
                AddStepDialog.__super__.onRender.apply(this);

                window.application.accession.views.actionStepFormats.drawSelect(this.ui.step_format, true, false);
            },

            onBeforeDetach: function() {
                this.ui.step_format.selectpicker('destroy');
            },

            onCreate: function () {
            }

        });

        let self = this;
        let addStepDialog = new AddStepDialog({
            model: this.model
        });
        addStepDialog.on('step:create', function() {
            self.addStepData(addStepDialog.ui.step_format.val());
            addStepDialog.destroy();
        });
        addStepDialog.render();
    }
});

module.exports = Layout;
