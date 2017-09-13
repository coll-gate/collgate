/**
 * @file panel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-11
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Dialog = require('../../main/views/dialog');
var Marionette = require('backbone.marionette');

var Controller = Marionette.Object.extend({
    create: function (data) {
        var CreatePanelDialog = Dialog.extend({
            template: require('../templates/panelcreate.html'),
            ui: {
                validate: "button.continue",
                name: "#panel_name"
            },

            events: {
                'click @ui.validate': 'onCreate',
                'input @ui.name': 'onNameInput'
            },

            initialize: function (options) {
                CreatePanelDialog.__super__.initialize.apply(this);
            },

            validateName: function () {
                var v = this.ui.name.val().trim();

                if (v.length > 128) {
                    this.ui.name.validateField('failed', gt.gettext("128 characters max"));
                    return false;
                } else if (v.length < 1) {
                    this.ui.name.validateField('failed', gt.gettext('1 characters min'));
                    return false;
                }
                return true;
            },

            // validate: function () {
            //     var valid = this.validateName();
            //     if (this.ui.name.hasClass('invalid')) {
            //         valid = false;
            //     }
            //
            //     return valid;
            // },

            onCreate: function () {
                if (this.validateName()) {
                    var name = this.ui.name.val().trim();
                    console.log(name);
                    console.log(data);

                    $.ajax({
                        type: "POST",
                        url: application.baseUrl + 'accession/panel/',
                        dataType: 'json',
                        contentType: 'application/json; charset=utf8',
                        data: JSON.stringify({name: name, selection: data}),
                        success: function (response) {
                            console.log(response)
                        }
                    });

                }

                // create a new local model and open an edit view with this model
                // var model = new PanelModel({
                //     name: name,
                //     accession_list: data
                // });
                //
                // this.destroy();
                //
                // var defaultLayout = new DefaultLayout();
                // application.main.showContent(defaultLayout);
                //
                // defaultLayout.showChildView('title', new TitleView({
                //     title: gt.gettext("Accession"),
                //     model: model
                // }));
                //
                // var accessionLayout = new AccessionLayout({model: model});
                // defaultLayout.showChildView('content', accessionLayout);
            }

        });

        var createPanelDialog = new CreatePanelDialog();
        createPanelDialog.render();
    }

});

module.exports = Controller;