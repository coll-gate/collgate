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
        'click @ui.step_continue': 'onProcessStep'
    },

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onActionCreate, this);
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

    enableTabs: function () {
        this.ui.steps_tab.parent().removeClass('disabled');
    },

    displayStepData: function(stepIndex, stepFormat) {
        if (stepFormat === null) {
            return;
        }

        let Element = window.application.accession.actions.getElement(stepFormat.id);
        if (Element && Element.ActionStepProcessView) {
            this.ui.step_format.val(stepFormat.get('label'));
            this.ui.step_description.text(new Element().description);

            this.showChildView('contextual', new Element.ActionStepProcessView({
                model: this.model,
                namingOptions: this.namingOptions,
                namingFormat: this.namingFormat,
                stepIndex: this.currentStepIndex
            }));
        }
    },

    onProcessStep: function() {
        // store current step before changes to new current one
        if (this.currentStepIndex >= 0) {
            // @todo
            // this.getChildView('contextual').processStep();
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
            if (this.model.get('completed')) {
                // all steps are readable
                for (let i = 0; i < this.model.get('data').steps.length; ++i) {
                    this.ui.step_index.append('<option value="' + i + '">' + _t("Step") + " " + i + '</option>');
                }

                this.ui.step_index.selectpicker({});

                // @todo display a finished panel
            } else {
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

                    if (currentStepFormat !== null) {
                        let stepFormat = window.application.accession.collections.actionStepFormats.findWhere({id: currentStepFormat.type});
                        actionLayout.displayStepData(currentStepIndex, stepFormat);
                        /*
                        let stepFormat = window.application.accession.collections.actionStepFormats.findWhere({id: currentStepFormat.type});
                        actionLayout.ui.step_format.val(stepFormat.get('label'));

                        let Element = window.application.accession.actions.getElement(currentStepFormat.type);
                        if (Element && Element.ActionStepProcessView) {
                            actionLayout.showChildView('contextual', new Element.ActionStepProcessView({
                                model: actionLayout.model,
                                namingOptions: actionLayout.namingOptions,
                                namingFormat: actionLayout.namingFormat,
                                stepIndex: actionLayout.currentStepIndex
                            }));
                        }*/
                    }

                    for (let i = 0; i < currentStepIndex+1; ++i) {
                        actionLayout.ui.step_index.append('<option value="' + i + '">' + _t("Step") + " " + i + '</option>');
                    }

                    actionLayout.ui.step_index.selectpicker({});
                });
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
