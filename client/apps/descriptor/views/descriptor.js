/**
 * @file descriptor.js
 * @brief Descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095), Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object descriptor',
    template: require("../../descriptor/templates/entity.html"),
    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        delete_btn: '.action.delete',
        edit_btn: '.action.edit',
        manage_btn: '.action.manage'
    },

    events: {
        'click @ui.delete_btn': 'deleteDescriptor',
        'click @ui.edit_btn': 'viewDescriptor',
        'click @ui.manage_btn': 'viewDescriptorValue'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                tag: {display: true, event: 'changeLabel'},
                edit: {display: true, event: 'viewDescriptor'},
                manage: {display: true, event: 'viewDescriptorValue'},
                remove: {display: true, event: 'deleteDescriptor'}
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

        // @todo check user permissions

        if (!this.model.get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            // properties.edit.disabled = true;
        }

        if (!_.contains(['enum_single', 'enum_pair', 'enum_ordinal'], this.model.get('format').type)) {
            properties.manage.disabled = true;
        }

        if (!this.model.get('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    onRender: function() {
        if (!window.application.permission.manager.isStaff()) {
            $(this.ui.delete_descriptor_model_type).hide();
        }
    },

    viewDescriptor: function() {
        Backbone.history.navigate("app/descriptor/descriptor/" + this.model.id + "/", {trigger: true});
        return false;
    },

    viewDescriptorValue: function () {
        if (_.contains(['enum_single', 'enum_pair', 'enum_ordinal'],this.model.get('format').type)) {
            Backbone.history.navigate("app/descriptor/descriptor/" + this.model.id + "/value/", {trigger: true});
        } else {
            $.alert.error(_t("Descriptor can not contain a list of values"));
        }
    },

    changeLabel: function () {
        if (!(window.application.permission.manager.isStaff() && this.model.get('can_modify'))) {
            return;
        }

        let ChangeLabel = require('../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the descriptor labels")
        });

        changeLabel.render();
        // changeLabel.ui.name.val(this.model.get('name'));

        return false;
    },

    deleteDescriptor: function () {
        // todo: Alert user only if the descriptor is used

        // old version:
        // if (this.model.get('num_descriptor_values') === 0) {
        //     this.model.destroy({wait: true});
        // } else {
        //     $.alert.error(_t("Some values exists for this type of descriptor"));
        // }

        application.descriptor.controllers.descriptor.delete(this.model);
    }
});

module.exports = View;
