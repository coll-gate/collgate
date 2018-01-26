/**
 * @file action.js
 * @brief Action controller
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-01-25
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let ActionModel = require('../models/action');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');

// let ActionLayout = require('../views/action/layout');

let Controller = Marionette.Object.extend({

    create: function() {
        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'meta-model', 'for-describable', 'accession.action']),
            dataType: 'json'
        }).done(function(data) {
            let CreateActionDialog = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_action'
                },
                template: require('../templates/actioncreate.html'),

                ui: {
                    validate: "button.continue",
                    name: "input[name=name]",
                    label: "input[name=label]",
                    type: "select[name=format]"
                },

                events: {
                    'click @ui.validate': 'onContinue',
                    'input @ui.name': 'onNameInput',
                    'input @ui.label': 'onLabelInput'
                },

                initialize: function (options) {
                    CreateActionDialog.__super__.initialize.apply(this);
                },

                onRender: function () {
                    CreateActionDialog.__super__.onRender.apply(this);

                    let ActionTypeCollection = require('../collections/actiontype');
                    let actionTypeCollection = new ActionTypeCollection();

                    actionTypeCollection.fetch({}).done(function (data) {
                        for (let i = 0; i < data.items.length; ++i) {
                            self.ui.type.append($('<option value="' + data.items[i].id + '">' + data.items[i].label + '</option>'));
                        }

                        self.ui.type.selectpicker({
                            style: 'btn-default',
                            container: 'body'
                        });
                    });
                },

                onBeforeDestroy: function() {
                    this.ui.type.selectpicker('destroy');

                    CreateActionDialog.__super__.onBeforeDestroy.apply(this);
                },

                onNameInput: function () {
                    let self = this;

                    if (this.validateName()) {
                        self.ui.name.validateField('ok');
                    }
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

                validate: function() {
                    let valid = this.validateName();
                    let type = this.ui.type.val();

                    if (type === "") {
                        $.alert.error(_t("The type must be defined"));
                        valid = false;
                    }

                     if (this.ui.name.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onContinue: function() {
                    let view = this;

                    if (this.validate()) {
                        let name = this.ui.name.val().trim();
                        let type = this.ui.type.val();

                        // create a new local model and open an edit view with this model
                        let model = new ActionModel({
                            name: name,
                            type: type
                        });

                        view.destroy();

                        let defaultLayout = new DefaultLayout();
                        window.application.main.showContent(defaultLayout);

                        defaultLayout.showChildView('title', new TitleView({
                            title: _t("Batch action type"),
                            model: model
                        }));

                        //let actionLayout = new ActionLayout({model: model});
                        // defaultLayout.showChildView('content', actionTypeLayout);
                    }
                }
            });

            let createActionView = new CreateActionDialog();
            createActionView.render();
        });
    }
});

module.exports = Controller;
