/**
 * @file index.js.js
 * @brief Index controller
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-02-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */


let Marionette = require('backbone.marionette');
let IndexModel = require('../models/index');
let Dialog = require('../../main/views/dialog');

let Controller = Marionette.Object.extend({

    // deleteModel: function (model) {
    //     let DeletePanelDialog = Dialog.extend({
    //         template: require('../../main/templates/confirm.html'),
    //         templateContext: function () {
    //             return {
    //                 title: _t("Delete descriptor"),
    //                 message: _t("Some values might exist for this descriptor." +
    //                     " Do you really want to delete this descriptor anyway?"),
    //                 confirm_txt: _("Yes"),
    //                 confirm_class: 'danger',
    //                 cancel_txt: _("No"),
    //                 cancel_class: 'default'
    //             }
    //         },
    //         ui: {
    //             confirm: "button.confirm"
    //         },
    //         events: {
    //             'click @ui.confirm': 'onDelete'
    //         },
    //
    //         initialize: function () {
    //             DeletePanelDialog.__super__.initialize.apply(this);
    //         },
    //
    //         onDelete: function () {
    //             model.destroy({wait: true});
    //             this.destroy();
    //             return false;
    //         }
    //
    //     });
    //
    //     let deletePanelDialog = new DeletePanelDialog();
    //     deletePanelDialog.render();
    // },

    create: function (collection) {
        let CreateIndexDialog = Dialog.extend({
            attributes: {
                'id': 'dlg_create_index'
            },
            template: require('../templates/indexcreate.html'),

            ui: {
                descriptor: "select[name=descriptor]",
                target: "select[name=target]",
                type: "select[name=type]",
                validate: "button.create"
            },

            events: {
                'click @ui.validate': 'onCreate'
            },

            onRender: function () {
                CreateIndexDialog.__super__.onRender.apply(this);

                // let DescriptorCollection = require('');
                // window.application.collections.describables

                window.application.descriptor.views.describables.drawSelect(this.ui.target);
                this.ui.type.selectpicker({});

                this.ui.descriptor.selectpicker({});

                // let SelectOption = require('../../main/renderers/selectoption');
                // new SelectOption({
                //     className: 'descriptor',
                //     collection: window.application.descriptor.collections.descriptors,
                // }).drawSelect(this.ui.descriptor);

                let descriptorCollection = window.application.descriptor.collections.descriptors;
                let descriptor_select = this.ui.descriptor;

                descriptorCollection.fetch({data: {more: 0}}).then(function () {
                    // Create drop-down descriptor groups
                    let i;
                    let opt_group_list = [];
                    for (i = 0; i < descriptorCollection.length; i++) {
                        let group_name = descriptorCollection.models[i].get('group_name');

                        if (group_name === null) {
                            group_name = _t('Unclassified');
                        }

                        let found = opt_group_list.find(function (element) {
                            return element.name === group_name;
                        });

                        if (!found) {
                            let opt_group = $('<optgroup></optgroup>');
                            opt_group.attr('label', group_name);
                            opt_group_list.push({
                                name: group_name,
                                el: opt_group
                            });
                        }
                    }

                    // Create descriptor options
                    let j;
                    for (j = 0; j < descriptorCollection.length; j++) {
                        let opt = $('<option></option>');
                        opt.attr('value', JSON.stringify([
                            descriptorCollection.models[j].get('name'),
                            descriptorCollection.models[j].get('id')
                        ]));
                        opt.attr('data-tokens', descriptorCollection.models[j].get('label') + ',' + descriptorCollection.models[j].get('name') + ',' + descriptorCollection.models[j].get('group_name'));
                        opt.html('<strong>' + descriptorCollection.models[j].get('label') + '</strong> <span class="text-muted">' + descriptorCollection.models[j].get('name') + '</span>');
                        let opt_group = _.findWhere(opt_group_list, {name: (descriptorCollection.models[j].get('group_name') || _t('Unclassified'))});
                        opt.appendTo(opt_group.el)
                    }

                    // Add descriptor groups to the selectpicker
                    let k;
                    for (k = 0; k < opt_group_list.length; k++) {
                        opt_group_list[k].el.appendTo(descriptor_select);
                    }
                    descriptor_select.selectpicker('refresh');
                });


            },

            onCreate: function () {
                // let view = this;

                // if (this.validate()) {
                    // create a new local model and open an edit view with this model
                    let model = new IndexModel({
                        type: JSON.parse(this.ui.type.val()),
                        descriptor: JSON.parse(this.ui.descriptor.val())[1],
                        target: this.ui.target.val()
                    });

                    model.save();

                    // this.collection.create(model);
                    this.destroy();
                    // model.collection.fetch();

                    // let defaultLayout = new DefaultLayout();
                    // window.application.main.showContent(defaultLayout);
                    //
                    // defaultLayout.showChildView('title', new TitleView({
                    //     title: _t("Descriptor"),
                    //     model: model
                    // }));

                    // let descriptorLayout = new DescriptorLayout({model: model});
                    // defaultLayout.showChildView('content', descriptorLayout);
                // }
            }
        });

        let createIndexView = new CreateIndexDialog({
            collection: collection
        });
        createIndexView.render();
    }
});

module.exports = Controller;
