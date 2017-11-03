/**
 * @file descriptormetamodel.js
 * @brief Meta-model of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object descriptor-meta-model',
    template: require('../templates/descriptormetamodel.html'),

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {title: _t("Edit label"), event: 'viewDescriptorMetaModelDetails'},
                tag: {display: true, event: 'editLabel'},
                manage: {display: true, event: 'viewDescriptorPanels'},
                remove: {display: true, event: 'deleteDescriptorMetaModel'}
            }
        }
    },

    ui: {
        edit_btn: '.action.edit',
        tag_btn: '.action.tag',
        manage_btn: '.action.manage',
        delete_btn: 'button.action.delete'
    },

    events: {
        'click @ui.edit_btn': 'viewDescriptorMetaModelDetails',
        'click @ui.tag_btn': 'editLabel',
        'click @ui.manage_btn': 'viewDescriptorPanels',
        'click @ui.delete_btn': 'deleteDescriptorMetaModel'
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        let properties = {
            edit: {disabled: false},
            remove: {disabled: false}
        };

        // @todo check with user permission

        if (!session.user.isSuperUser || !session.user.isStaff) {
            properties.edit.disabled = true;
        }

        if (this.model.get('num_descriptor_models') > 0 || !session.user.isSuperUser || !session.user.isStaff) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    onRender: function () {
        // localize content-type
        application.main.views.contentTypes.htmlFromValue(this.el);
    },

    viewDescriptorMetaModelDetails: function () {
        Backbone.history.navigate("app/descriptor/meta-model/" + this.model.id + "/", {trigger: true});
    },

    viewDescriptorPanels: function () {
        Backbone.history.navigate("app/descriptor/meta-model/" + this.model.id + "/panel/", {trigger: true});
    },

    deleteDescriptorMetaModel: function () {
        // if (this.model.get('num_descriptor_models') === 0) {
        //     this.model.destroy({wait: true});
        // } else {
        //     $.alert.error(_t("It is not permitted to delete a meta-model of descriptor that contains some panels"));
        // }
        this.model.destroy({wait: true});
    },

    editLabel: function () {
        let ChangeLabel = require('../../main/views/entitychangelabel');
        let changeLabel = new ChangeLabel({
            model: this.model,
            title: _t("Change the labels for the meta-model of descriptor")});

        changeLabel.render();

        return false;
    },
});

module.exports = View;
