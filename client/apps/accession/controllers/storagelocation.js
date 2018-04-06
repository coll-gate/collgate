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
                            placeholder: _t("Enter a storage location name.")
                        })
                    ).fixSelect2Position();
                },

                onBeforeDestroy: function () {
                    this.ui.storagelocation.selectpicker('destroy');
                    CreateStorageLocationView.__super__.onBeforeDestroy.apply(this);
                },

                // validateAccession: function () {
                //     let accessionId = 0;
                //
                //     if (this.ui.accession.val())
                //         accessionId = parseInt(this.ui.accession.val());
                //
                //     if (accessionId === 0 || isNaN(accessionId)) {
                //         $(this.ui.accession).validateField('failed', _t('The accession must be defined'));
                //         return false;
                //     } else {
                //         $(this.ui.accession).validateField('ok');
                //         return true;
                //     }
                // },

                validate: function () {
                    // let valid_accession = this.validateAccession();
                    // return valid_accession;

                    // todo!
                    return 1
                },

                onCreate: function () {
                    let self = this;

                    if (self.validate()) {
                        let parent_storage_location = parseInt(this.ui.storagelocation.val());
                        let name = this.ui.name.val();
                        let label = this.ui.label.val();

                        // let label_json = {en:'', fr:''};
                        // label_json[window.session.language] = label;

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
