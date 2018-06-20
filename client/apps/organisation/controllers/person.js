/**
 * @file person.js
 * @brief Person controller
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-04
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let EstablishmentModel = require('../models/establishment');
let PersonModel = require('../models/person');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let Dialog = require('../../main/views/dialog');
// let PersonLayout = require('../views/personlayout');


let Controller = Marionette.Object.extend({

    create: function(organisation, collection) {
        $.ajax({
            type: "GET",
            url: window.application.url(['descriptor', 'layout', 'for-describable', 'organisation.person']),
            dataType: 'json'
        }).done(function(data) {
            // @todo
    //         let CreateEstablishmentView = Dialog.extend({
    //             attributes: {
    //                 'id': 'dlg_create_establishment'
    //             },
    //             template: require('../templates/establishmentcreate.html'),
    //
    //             ui: {
    //                 create: "button.create",
    //                 organisation: "#organisation_name",
    //                 name: "#establishment_name"
    //             },
    //
    //             events: {
    //                 'click @ui.create': 'onCreate',
    //                 'input @ui.name': 'onNameInput'
    //             },
    //
    //             initialize: function(options) {
    //                 options || (options = {});
    //
    //                 Dialog.__super__.initialize.apply(this, options);
    //             },
    //
    //             onRender: function () {
    //                 CreateEstablishmentView.__super__.onRender.apply(this);
    //
    //                 // defines organisation name
    //                 this.ui.organisation.val(this.getOption('organisation').get('name'));
    //             },
    //
    //             onBeforeDestroy: function () {
    //                 CreateEstablishmentView.__super__.onBeforeDestroy.apply(this);
    //             },
    //
    //             onNameInput: function () {
    //                 let name = this.ui.name.val().trim();
    //
    //                 if (this.validateName()) {
    //                     let filters = {
    //                         method: 'ieq',
    //                         fields: ['name'],
    //                         name: name
    //                     };
    //
    //                     $.ajax({
    //                         type: "GET",
    //                         url: window.application.url(['organisation', 'establishment', 'search']),
    //                         dataType: 'json',
    //                         data: {filters: JSON.stringify(filters)},
    //                         el: this.ui.name
    //                     }).done(function (data) {
    //                         if (data.items.length > 0) {
    //                             for (let i in data.items) {
    //                                 let t = data.items[i];
    //
    //                                 if (t.value.toUpperCase() === name.toUpperCase()) {
    //                                     $(this.el).validateField('failed', _t('Establishment name already in usage'));
    //                                     break;
    //                                 }
    //                             }
    //                         } else {
    //                             $(this.el).validateField('ok');
    //                         }
    //                     });
    //                 }
    //             },
    //
    //             validateName: function () {
    //                 let v = this.ui.name.val().trim();
    //
    //                 if (v.length > 255) {
    //                     $(this.ui.name).validateField('failed', _t('characters_max', {count: 255}));
    //                     return false;
    //                 } else if (v.length < 3) {
    //                     $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
    //                     return false;
    //                 }
    //
    //                 return true;
    //             },
    //
    //             validate: function () {
    //                 let valid = this.validateName();
    //
    //                 if (this.ui.name.hasClass('invalid')) {
    //                     valid = false;
    //                 }
    //
    //                 return valid;
    //             },
    //
    //             onCreate: function () {
    //                 let name = this.ui.name.val().trim();
    //
    //                 if (this.validate()) {
    //                     let model = new EstablishmentModel({
    //                         layout: data[0].id,
    //                         name: name,
    //                         organisation: this.getOption('organisation').get('id')
    //                     });
    //
    //                     this.destroy();
    //
    //                     let defaultLayout = new DefaultLayout();
    //                     application.main.showContent(defaultLayout);
    //
    //                     defaultLayout.showChildView('title', new TitleView({
    //                         title: _t("Establishment"),
    //                         model: model,
    //                         organisation: this.getOption('organisation').get('id')
    //                     }));
    //
    //                     let establishmentLayout = new EstablishmentLayout({model: model});
    //                     defaultLayout.showChildView('content', establishmentLayout);
    //                 }
    //             }
    //         });
    //
    //         let dialog = new CreateEstablishmentView({
    //             organisation: organisation,
    //             collection: collection
    //         });
    //
    //         dialog.render();
         });
    }
});

module.exports = Controller;
