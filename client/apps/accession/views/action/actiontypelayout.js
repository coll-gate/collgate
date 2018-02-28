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
let Dialog = require('../../../main/views/dialog');

// let Layout = LayoutView.extend({
//     template: require("../../templates/action/actiontypelayout.html"),
//
//     attributes: {
//         style: "height: 100%;"
//     },
//
//     ui: {
//         general_tab: 'a[aria-controls=general]',
//         steps_tab: 'a[aria-controls=steps]',
//         step_format: 'select.action-step-format',
//         description: 'textarea[name=description]',
//         config_save: 'button[name=save]',
//         step_index: 'select.action-type-step-index',
//         name: 'input[name=name]',
//         delete_step: 'span[name=delete-step]',
//         step_description: 'p[name=step-description]'
//     },
//
//     regions: {
//         'general': "div.tab-pane[name=general]",
//         'steps': "div.tab-pane[name=steps]",
//         'contextual': "div.contextual-region"
//     },
//
//     events: {
//         'change @ui.step_format': 'changeFormatType',
//         'click @ui.config_save': 'onUpdateConfig',
//         'click @ui.delete_step': 'onDeleteCurrentStep'
//     },
//
//     initialize: function (model, options) {
//         Layout.__super__.initialize.apply(this, arguments);
//
//         if (this.model.isNew()) {
//             this.listenTo(this.model, 'change:id', this.onActionTypeCreate, this);
//         }
//
//         // naming options
//         let self = this;
//         let namingOptions = Object.resolve('data.naming_options', this.model.get('format')) || [];
//
//         this.namingOptions = null;
//         this.namingFormat = null;
//         this.currentStepIndex = -1;
//
//         self.namingOptionsPromise = $.ajax({
//             type: "GET",
//             url: window.application.url(['accession', 'naming', 'batch']),
//             dataType: 'json',
//         }).done(function(data) {
//             let len = (data.format.match(/{CONST}/g) || []).length;
//
//             if (namingOptions.length !== len) {
//                 namingOptions = new Array(len);
//             }
//
//             self.namingOptions = namingOptions;
//             self.namingFormat = data.format;
//         });
//     },
//
//     onActionTypeCreate: function () {
//         // re-render once created
//         this.render();
//
//         // and update history
//         Backbone.history.navigate('app/accession/actiontype/' + this.model.get('id') + '/', {
//             /*trigger: true,*/
//             replace: false
//         });
//     },
//
//     enableTabs: function () {
//         this.ui.steps_tab.parent().removeClass('disabled');
//     },
//
//     changeFormatType: function () {
//         let formatType = this.ui.step_format.val();
//
//         // update the contextual region according to the format
//         let Element = window.application.accession.actions.getElement(formatType);
//         if (Element && Element.ActionStepFormatDetailsView) {
//             let stepData = new Element().defaultFormat();
//             stepData.index = this.currentStepIndex;
//             stepData.type = formatType;
//
//             // overwrite previous data
//             this.model.get('format')['steps'][this.currentStepIndex] = stepData;
//
//             this.showChildView('contextual', new Element.ActionStepFormatDetailsView({
//                 model: this.model,
//                 namingOptions: this.namingOptions,
//                 namingFormat: this.namingFormat,
//                 stepIndex: this.currentStepIndex
//             }));
//         } else {
//             this.getRegion('contextual').empty();
//         }
//     },
//
//     loadCurrentStepData: function() {
//         if (this.currentStepIndex >= 0) {
//             let stepData = this.model.get('format')['steps'][this.currentStepIndex];
//             this.ui.step_format.val(stepData.type).prop('disabled', false).selectpicker('refresh');
//
//             let Element = window.application.accession.actions.getElement(stepData.type);
//             let actionFormatType = new Element.ActionStepFormatDetailsView({
//                 model: this.model,
//                 namingOptions: this.namingOptions,
//                 namingFormat: this.namingFormat,
//                 stepIndex: this.currentStepIndex
//             });
//
//             this.ui.step_description.text(new Element().description);
//             this.showChildView('contextual', actionFormatType);
//         }
//     },
//
//     storeCurrentStepData: function() {
//         // store current step before changes to new current one
//         if (this.currentStepIndex >= 0) {
//             this.getChildView('contextual').storeData();
//         }
//     },
//
//     changeStep: function () {
//         let format = this.model.get('format');
//         let idx = parseInt(this.ui.step_index.val());
//
//         if (idx < 0) {
//             // create a new one
//             if (format['steps'].length >= 10) {
//                 $.alert.warning(_t("Max number of step reached (10)"));
//                 return;
//             } else {
//                 let nextIdx = format.steps.length;
//                 let formatType = this.ui.step_format.val();
//
//                 let stepData = {
//                    'index': nextIdx,
//                    'type': 'accession_list'
//                 };
//
//                 let element = window.application.accession.actions.newElement(formatType);
//                 if (element) {
//                     stepData = element.defaultFormat();
//                 }
//
//                 stepData.index = nextIdx;
//                 stepData.type = formatType;
//
//                 // initial step data
//                 this.model.get('format')['steps'].push(stepData);
//
//                 this.ui.step_index
//                     .append('<option value="' + nextIdx + '">' + _t("Step") + " " + nextIdx + '</option>')
//                     .val(nextIdx)
//                     .selectpicker('refresh');
//
//                 this.ui.step_format.prop('disabled', false).selectpicker('refresh');
//                 idx = nextIdx;
//             }
//         }
//
//         // set into the model
//         this.storeCurrentStepData();
//
//         this.currentStepIndex = idx;
//         this.loadCurrentStepData();
//     },
//
//     onRender: function () {
//         let format = this.model.get('format');
//         let actionTypeLayout = this;
//
//         for (let i = 0; i < format.steps.length; ++i) {
//             this.ui.step_index.append('<option value="' + i + '">' + _t("Step") + " " + i + '</option>');
//         }
//
//         this.namingOptionsPromise.then(function() {
//             actionTypeLayout.ui.step_index.selectpicker({}).on('change', $.proxy(actionTypeLayout.changeStep, actionTypeLayout));
//         });
//
//         window.application.accession.views.actionStepFormats.drawSelect(this.ui.step_format, true, false);
//         this.ui.step_format.prop('disabled', true).selectpicker('refresh');
//
//         if (!this.model.isNew()) {
//             if (format.steps.length) {
//                 // select first step if exists
//                 this.namingOptionsPromise.then(function () {
//                     actionTypeLayout.ui.step_index.val(0).selectpicker('refresh');
//                     actionTypeLayout.currentStepIndex = 0;
//                     actionTypeLayout.loadCurrentStepData();
//                 });
//             }
//
//             this.enableTabs();
//         } else {
//         }
//     },
//
//     onBeforeDetach: function () {
//         this.ui.step_index.selectpicker('destroy');
//         this.$el.find("select.action-step-format").selectpicker("destroy");
//     },
//
//     onUpdateConfig: function() {
//         let name = this.ui.name.val().trim();
//         let description = this.ui.description.val().trim();
//
//         // store possible last changes on current step
//         this.storeCurrentStepData();
//
//         let model = this.model;
//         let format = model.get('format');
//
//         if (model.isNew()) {
//             model.save({name: name, description: description, format: format}, {wait: true}).then(function () {
//                 $.alert.success(_t("Successfully changed !"));
//                 Backbone.history.navigate('app/accession/actiontype/' + model.get('id') + '/', {trigger: true, replace: true});
//             });
//         } else {
//             model.save({name: name, description: description, format: format}, {wait: true, patch: true}).then(function () {
//                 $.alert.success(_t("Successfully changed !"));
//                 Backbone.history.navigate('app/accession/actiontype/' + model.get('id') + '/', {trigger: true, replace: true});
//             });
//         }
//     },
//
//     onDeleteCurrentStep: function () {
//         if (this.currentStepIndex >= 0) {
//             let format = this.model.get('format');
//             format.steps.splice(this.currentStepIndex, 1);
//
//             this.getRegion('contextual').empty();
//
//             this.ui.step_index.find('option:not([value=-1])').remove();
//
//             for (let i = 0; i < format.steps.length; ++i) {
//                this.ui.step_index.append('<option value="' + i + '">' + _t("Step") + " " + i + '</option>');
//             }
//
//             if (this.currentStepIndex > 1) {
//                 --this.currentStepIndex;
//                 this.loadCurrentStepData();
//             } else if (this.currentStepIndex === 0 && format['steps'].length > 0) {
//                 this.loadCurrentStepData();
//             } else {
//                 this.currentStepIndex = -1;
//             }
//
//             this.ui.step_index.val(this.currentStepIndex).selectpicker('refresh');
//         }
//     }
// });

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
        let self = this;

        for (let i = 0; i < steps.length; ++i) {
            let panel = $('<div class="panel panel-default" style="margin: 10px 0px;"></div>');
            panel.attr('panel-id', i);

            let heading = $('<div class="panel-heading unselectable current" data-toggle="tooltip" data-placement="left" title="' + _t('Collapse/Expand') + '">');
            panel.append(heading);

            let title = $('<span name="step-label" class="action"></span>').on('click', function() {
                self.onChangeFormatType(parseInt(panel.attr('panel-id')));
            });
            heading.append(title);

            this.setupHelpers(panel, heading, i, i !== 0);

            let panelCollapse = $('<div class="panel-collapse collapse"></div>');
            panelCollapse.attr('id', 'action_step' + i);
            panel.append(panelCollapse);
            if (i === 0) {
                panelCollapse.addClass('in');
            }

            let content = $('<div class="panel-body-no" style="margin: 10px;"></div>');
            panelCollapse.append(content);

            this.ui.steps_group.append(panel);
            this.addRegion('step' + i, '#action_step' + i + ' > div');
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
            this.$el.find('div[panel-id=' + stepIndex + ']').find('span[name=step-label]').text(stepFormat.get('label'));
        }
    },

    setupHelpers: function(panel, heading, stepIndex, collapsed) {
        let self = this;

        let helpers = $('<div class="pull-right"><div class="btn-group btn-group-sm"><a class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="action fa fa-lg fa-cog" style="color: gray"></span></a></div><a class="accordion-toggle" data-toggle="collapse" href="#action_step' + stepIndex + '" style="margin-left: 20px;"></a></div>');
        if (collapsed) {
            helpers.children('a.accordion-toggle').addClass('collapsed');
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

        heading.on('dblclick', function(e) {
            heading.parent().children('div.panel-collapse').collapse('toggle');
            return true;
        });
    },

    addStepData: function(stepFormat) {
        if (stepFormat) {
            let self = this;
            let i = this.model.get('format').steps.length;

            let panel = $('<div class="panel panel-default" style="margin: 10px 0px;"></div>');
            panel.attr('panel-id', i);

            let heading = $('<div class="panel-heading unselectable current" data-toggle="tooltip" data-placement="left" title="' + _t('Collapse/Expand') + '">');
            panel.append(heading);

            let title = $('<span name="step-label" class="action"></span>').on('click', function() {
                self.onChangeFormatType(parseInt(panel.attr('panel-id')));
            });
            heading.append(title);

            this.setupHelpers(panel, heading, i, false);

            let panelCollapse = $('<div class="panel-collapse collapse"></div>');
            panelCollapse.attr('id', 'action_step' + i);
            panelCollapse.addClass('in');
            panel.append(panelCollapse);

            let content = $('<div class="panel-body-no" style="margin: 10px;"></div>');
            panelCollapse.append(content);

            this.ui.steps_group.append(panel);
            this.addRegion('step' + i, '#action_step' + i + ' > div');

            let stepData = {};

            let element = window.application.accession.actions.newElement(stepFormat);
            if (element) {
                stepData = element.defaultFormat();
            }

            stepData.index = i;
            stepData.type = stepFormat;

            this.model.get('format').steps.push(stepData);
            this.setupStepData(i, stepData);
        } else {

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

            onBeforeDetach: function () {
                this.ui.step_format.selectpicker('destroy');
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
