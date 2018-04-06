/**
 * @file storagelocation.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-04-04
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let StorageLocationModel = require('../models/storagelocation');
let Dialog = require('../../main/views/dialog');
let Search = require('../../main/utils/search');

let Controller = Marionette.Object.extend({
    create: function (selected_parent) {
        selected_parent || (selected_parent = null);

        let storage_locations = $.ajax({
            type: "GET",
            url: window.application.url(['accession', 'storagelocation']),
            dataType: 'json'
        });

        storage_locations.then(function (data) {
            let CreateStorageLocationView = Dialog.extend({
                attributes: {
                    'id': 'dlg_create_storage'
                },
                template: require('../templates/storagelocation/storagelocationcreate.html'),
                templateContext: function () {
                    return {
                        storagelocations: data.items,
                        title: _t("Create a storage location"),
                    };
                },

                ui: {
                    validate: "button.create",
                    name: "#name",
                    label: "#language-label",
                    storagelocation: "#storagelocation",
                },

                events: {
                    'click @ui.validate': 'onCreate',
                    'input @ui.name': 'onNameInput',
                    'input @ui.label': 'onLabelInput',
                },

                onRender: function () {
                    CreateStorageLocationView.__super__.onRender.apply(this);
                    this.ui.storagelocation.select2(Search(
                        this.ui.storagelocation.parent(),
                        window.application.url(['accession', 'storagelocation', 'search']),
                        function (params) {
                            return {
                                method: 'icontains',
                                fields: ['label'],
                                // 'name': params.term.trim(),
                                'label': params.term.trim()
                            };
                        }, {
                            minimumInputLength: 1,
                            placeholder: _t("Enter a storage location name or leave blank to set a root location.")
                        })
                    ).fixSelect2Position();
                },

                onBeforeDestroy: function () {
                    this.ui.storagelocation.selectpicker('destroy');
                    CreateStorageLocationView.__super__.onBeforeDestroy.apply(this);
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
                            url: window.application.url(['accession', 'storagelocation', 'search']),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf8',
                            data: {filters: JSON.stringify(filters)},
                        }).done(function (data) {
                            for (let i in data.items) {
                                let t = data.items[i];
                                if (t.name.toUpperCase() === name.toUpperCase()) {
                                    self.ui.name.validateField('failed', _t('The name of the storage location is already used'));
                                    return;
                                }
                            }

                            self.ui.name.validateField('ok');
                        });
                    }
                },

                onLabelInput: function () {
                    let label = this.ui.label.val().trim();
                    this.ui.name.val(label.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "_").toUpperCase());
                    this.ui.name.trigger('input')
                },

                validateName: function () {
                    let name_value = this.ui.name.val().trim();

                    if (name_value.length > 128) {
                        this.ui.name.validateField('failed', _t('characters_max', {count: 128}));
                        return false;
                    } else if (name_value.length < 1) {
                        this.ui.name.validateField('failed', _t('characters_min', {count: 1}));
                        return false;
                    }
                    return true;
                },

                validate: function () {
                    let valid = this.validateName();

                    if (this.ui.name.hasClass('invalid')) {
                        valid = false;
                    }

                    return valid;
                },

                onCreate: function () {
                    let self = this;

                    if (self.validate()) {
                        let parent_storage_location = parseInt(this.ui.storagelocation.val());
                        let name = this.ui.name.val();
                        let label = this.ui.label.val();

                        let model = new StorageLocationModel({
                            name: name,
                            label: label,
                            parent_storage_location: parent_storage_location
                        });

                        model.save();
                        self.destroy();
                    }
                }
            });

            let createStorageLocationView = new CreateStorageLocationView();
            createStorageLocationView.render();
        });
    }
});

module.exports = Controller;
