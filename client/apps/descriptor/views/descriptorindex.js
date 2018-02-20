/**
 * @file descriptorindex.js
 * @brief Index item view
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-02-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object index',
    template: require("../../descriptor/templates/entity.html"),
    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        delete_btn: '.action.delete',
        // edit_btn: '.action.edit',
        // manage_btn: '.action.manage'
    },

    events: {
        'click @ui.delete_btn': 'deleteIndex',
        // 'click @ui.edit_btn': 'viewDescriptor',
        // 'click @ui.manage_btn': 'viewDescriptorValue'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                // tag: {display: true, event: 'changeLabel'},
                // edit: {display: true, event: 'viewDescriptor'},
                // manage: {display: true, event: 'viewDescriptorValue'},
                remove: {display: true, event: 'deleteIndex'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        let properties = {
            edit: {disabled: false},
            manage: {disabled: false},
            remove: {disabled: false}
        };

        // // @todo check user permissions
        //
        // if (!this.model.get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
        //     // properties.edit.disabled = true;
        // }
        //
        // if (!_.contains(['enum_single', 'enum_pair', 'enum_ordinal'], this.model.get('format').type)) {
        //     properties.manage.disabled = true;
        // }
        //
        // if (!this.model.get('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
        //     properties.remove.disabled = true;
        // }

        if (!window.application.permission.manager.isStaff()) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    onRender: function() {
        if (!window.application.permission.manager.isStaff()) {
            $(this.ui.delete_btn).hide();
        }
    },

    // viewDescriptorIndex: function() {
    //     Backbone.history.navigate("app/descriptor/index/" + this.model.id + "/", {trigger: true});
    //     return false;
    // },

    deleteIndex: function () {
        // todo: Alert user only if the descriptor is used

        // old version:
        // if (this.model.get('num_descriptor_values') === 0) {
            this.model.destroy({wait: true});
        // } else {
        //     $.alert.error(_t("Some values exists for this type of descriptor"));
        // }

        // window.application.descriptor.controllers.index.delete(this.model);
    }
});

module.exports = View;
