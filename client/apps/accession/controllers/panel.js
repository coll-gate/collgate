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

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var AccessionPanelModel = require('../models/panel');
var AccessionPanelLayout = require('../views/panellayout');

var Controller = Marionette.Object.extend({
    create: function (selection, related_entity) {
        related_entity || (related_entity = null);

        var CreatePanelDialog = Dialog.extend({
            template: require('../templates/panelcreate.html'),
            ui: {
                validate: "button.create",
                name: "#panel_name",
                descriptor_meta_model: "#meta_model"
            },

            events: {
                'click @ui.validate': 'onCreate',
                'input @ui.name': 'onNameInput'
            },

            initialize: function (options) {
                CreatePanelDialog.__super__.initialize.apply(this);
            },

            onNameInput: function () {
                var name = this.ui.name.val().trim();

                if (this.validateName()) {
                    var filters = {
                        method: 'ieq',
                        fields: ['name'],
                        'name': name
                    };

                    $.ajax({
                        type: "GET",
                        url: application.baseUrl + 'accession/panel/search/',
                        dataType: 'json',
                        data: {filters: JSON.stringify(filters)},
                        el: this.ui.name,
                        success: function (data) {
                            if (data.items.length > 0) {
                                for (var i in data.items) {
                                    var panel = data.items[i];

                                    if (panel.name.toUpperCase() === name.toUpperCase()) {
                                        $(this.el).validateField('failed', _t('Accession panel name already in usage'));
                                        break;
                                    }
                                }
                            } else {
                                $(this.el).validateField('ok');
                            }
                        }
                    });
                }
            },

            validateName: function () {
                var v = this.ui.name.val().trim();

                if (v.length > 128) {
                    this.ui.name.validateField('failed', _t('characters_max', {count: 128}));
                    return false;
                } else if (v.length < 3) {
                    this.ui.name.validateField('failed', _t('characters_min', {count: 3}));
                    return false;
                }

                return true;
            },

            onCreate: function () {
                var view = this;

                if (this.ui.name.isValidField()) {
                    var name = this.ui.name.val().trim();

                    // create a new local model and open an edit view with this model
                    var model = new AccessionPanelModel({
                        name: name,
                        selection: {
                            select: selection,
                            from: related_entity
                        },
                        descriptors: {},
                        descriptor_meta_model: null
                    });

                    view.destroy();

                    var defaultLayout = new DefaultLayout();
                    application.main.showContent(defaultLayout);

                    defaultLayout.showChildView('title', new TitleView({
                        title: _t("Classification entry"),
                        model: model
                    }));

                    var accessionPanelLayout = new AccessionPanelLayout({model: model});
                    defaultLayout.showChildView('content', accessionPanelLayout);
                }
            }
        });

        var createPanelDialog = new CreatePanelDialog();
        createPanelDialog.render();
    }

});

module.exports = Controller;