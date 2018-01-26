/**
 * @file actiontype.js
 * @brief Action type controller
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-19
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let ActionTypeModel = require('../models/actiontype');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');

let ActionTypeLayout = require('../views/action/actiontypelayout');

let Controller = Marionette.Object.extend({

    create: function() {
        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'meta-model', 'for-describable', 'accession.action']),
            dataType: 'json'
        }).done(function(data) {
            let CreateActionTypeDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_actiontype'
                },
                template: require('../templates/actiontype/actiontypecreate.html'),

                ui: {
                    validate: "button.continue",
                    name: "input[name=name]",
                    label: "input[name=label]",
                    format_type: "select[name=format]"
                },

                events: {
                    'click @ui.validate': 'onContinue',
                    'input @ui.name': 'onNameInput',
                    'input @ui.label': 'onLabelInput'
                },

                initialize: function (options) {
                    CreateActionTypeDialog.__super__.initialize.apply(this);
                },

                onRender: function () {
                    CreateActionTypeDialog.__super__.onRender.apply(this);

                    window.application.accession.views.actionTypeFormats.drawSelect(
                        this.ui.format_type, true, false, 'creation');
                },

                onBeforeDestroy: function() {
                    this.ui.format_type.selectpicker('destroy');

                    CreateActionTypeDialog.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    let name = this.ui.name.val().trim();
                    let self = this;

                    if (this.validateName()) {
                        let filters = {
                            method: 'ieq',
                            fields: ['name'],
                            'name': name
                        };

                        $.ajax({
                            type: "GET",
                            url: window.application.url(['accession', 'action', 'search']),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                        }).done(function (data) {
                            for (let i in data.items) {
                                let t = data.items[i];

                                if (t.value.toUpperCase() === name.toUpperCase()) {
                                    self.ui.name.validateField('failed', _t('Name already used'));
                                    return;
                                }
                            }

                            self.ui.name.validateField('ok');
                        });
                    }
                },

                onLabelInput: function () {

                },

                validateName: function() {
                    let v = this.ui.name.val().trim();

                    if (v.length > 128) {
                        this.ui.name.validateField('failed', _t('characters_max', {count: 128}));
                        return false;
                    } else if (v.length < 1) {
                        this.ui.name.validateField('failed', _t('characters_min', {count: 1}));
                        return false;
                    }

                    return true;
                },

                validateLabel: function() {
                    let v = this.ui.name.val().trim();

                    if (v.length > 128) {
                        this.ui.label.validateField('failed', _t('characters_max', {count: 128}));
                        return false;
                    } else if (v.length < 1) {
                        this.ui.label.validateField('failed', _t('characters_min', {count: 1}));
                        return false;
                    }

                    return true;
                },

                validate: function() {
                    let valid = this.validateName();
                    let formatType = this.ui.format_type.val();

                    if (formatType === "") {
                        $.alert.error(_t("The format must be defined"));
                        valid = false;
                    }

                     if (this.ui.name.hasClass('invalid') ||
                         this.ui.label.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onContinue: function() {
                    let view = this;

                    if (this.validate()) {
                        let name = this.ui.name.val().trim();
                        let label = this.ui.label.val().trim();
                        let formatType = this.ui.format_type.val();

                        // create a new local model and open an edit view with this model
                        let model = new ActionTypeModel({
                            name: name,
                            label: label,
                            format: {type: formatType}
                        });

                        view.destroy();

                        let defaultLayout = new DefaultLayout();
                        window.application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Batch action type"),
                            model: model
                        }));

                        let actionTypeLayout = new ActionTypeLayout({model: model});
                        defaultLayout.showChildView('content', actionTypeLayout);
                    }
                }
            });

            let createActionTypeView = new CreateActionTypeDialog();
            createActionTypeView.render();
        });
    }
});

module.exports = Controller;
