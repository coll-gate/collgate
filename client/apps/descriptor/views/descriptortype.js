/**
 * @file descriptortype.js
 * @brief Type of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var _ = require('underscore');
var DescriptorTypeModel = require('../models/descriptortype');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-type',
    template: require('../templates/descriptortype.html'),

    ui: {
        delete_btn: '.action.delete',
        edit_btn: '.action.edit',
        manage_btn: '.action.manage'
    },

    events: {
        'click @ui.delete_btn': 'deleteDescriptorType',
        'click @ui.edit_btn': 'viewDescriptorType',
        'click @ui.manage_btn': 'viewDescriptorValue'
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

        // @todo check user permissions

        // if (!this.model.get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
        //     btn_group.children('button.action.edit').prop('disabled', true);
        // }

        if (!_.contains(['enum_single', 'enum_pair', 'enum_ordinal'],this.model.get('format').type)) {
            btn_group.children('button.action.manage').prop('disabled', true);
        }

        if (!this.model.get('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
            btn_group.children('button.action.delete').prop('disabled', true);
        }
    },

    viewDescriptorType: function() {
        Backbone.history.navigate("app/descriptor/group/" + this.model.get('group') + "/type/" + this.model.id + '/', {trigger: true});
        return false;
    },

    viewDescriptorValue: function () {
        if (_.contains(['enum_single', 'enum_pair', 'enum_ordinal'],this.model.get('format').type)) {
            Backbone.history.navigate("app/descriptor/group/" + this.model.get('group') + "/type/" + this.model.id + '/value/', {trigger: true});
        } else {
            $.alert.error(gt.gettext("Descriptor can not contain a list of values"));
        }
        return false;
    },

    deleteDescriptorType: function () {
        if (this.model.get('num_descriptor_values') === 0) {
            this.model.destroy({wait: true});
        } else {
            $.alert.error(gt.gettext("Some values exists for this type of descriptor"));
        }
        return false;
    }
});

module.exports = View;

