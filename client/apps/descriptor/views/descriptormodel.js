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
var DescriptorModelModel = require('../models/descriptormodel');

var View = Marionette.ItemView.extend({
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
            behaviorClass: require('../../main/behaviors/actionbuttonevents')
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        var rowActionButtons = _.template(require('../../main/templates/rowactionsbuttons.html')());
        this.$el.append(rowActionButtons);

        var btn_group = this.$el.children('div.row-action-group').children('div.action.actions-buttons');

        // @todo check with user permission
        // if (!this.getOption('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
        //     btn_group.children('button.action.delete').prop('disabled', true);
        // }
    },

    viewDescriptorModelDetails: function() {
        Backbone.history.navigate("app/descriptor/model/" + this.model.id + "/", {trigger: true});
    },

    viewDescriptorModelTypes: function() {
        Backbone.history.navigate("app/descriptor/model/" + this.model.id + "/type/", {trigger: true});
    },

    deleteDescriptorModel: function() {
        if (this.model.get('num_descriptor_types') === 0) {
            this.model.destroy({wait: true});
        }
    }
});

module.exports = View;

