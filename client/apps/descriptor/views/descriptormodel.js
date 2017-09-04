/**
 * @file descriptormodel.js
 * @brief Model of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object descriptor-model',
    template: require('../templates/descriptormodel.html'),

    ui: {
        delete_btn: 'button.action.delete',
        edit_btn: '.action.edit',
        manage_btn: '.action.manage'
    },

    events: {
        'click @ui.delete_btn': 'deleteDescriptorModel',
        'click @ui.edit_btn': 'viewDescriptorModelDetails',
        'click @ui.manage_btn': 'viewDescriptorModelTypes'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {title: gt.gettext("Edit label"), event: 'viewDescriptorModelDetails'},
                manage: {display: true, event: 'viewDescriptorModelTypes'},
                remove: {display: true, event: 'deleteDescriptorModel'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        var properties = {
            tag: {disabled: false},
            remove: {disabled: false}
        };

        // @todo check with user permission

        if (/*!this.model.get('can_modify') ||*/ !session.user.isSuperUser || !session.user.isStaff) {
            properties.tag.disabled = true;
        }

        if (this.model.get('num_descriptor_model_types') > 0 || /*!this.model.get('can_delete') ||*/ !session.user.isSuperUser || !session.user.isStaff) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    onRender: function() {
    },

    viewDescriptorModelDetails: function() {
        Backbone.history.navigate("app/descriptor/model/" + this.model.id + "/", {trigger: true});
    },

    viewDescriptorModelTypes: function() {
        Backbone.history.navigate("app/descriptor/model/" + this.model.id + "/type/", {trigger: true});
    },

    deleteDescriptorModel: function() {
        if (this.model.get('num_descriptor_model_types') === 0) {
            this.model.destroy({wait: true});
        }
    }
});

module.exports = View;
